import { Router } from "express";
import { db, captureCandidatesTable, knowledgeNodesTable, eventLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractKnowledgeFromTranscript, generateEmbedding } from "../lib/openai";
import {
  ExtractKnowledgeBody,
  DetectConflictsBody,
  ConfirmNodeBody,
  DismissNodeBody,
  MergeNodeBody,
  UndoNodeBody,
} from "@workspace/api-zod";

const router = Router();

function getConfidenceTier(confidence: number): "HIGH" | "MEDIUM" | "LOW" {
  if (confidence > 0.85) return "HIGH";
  if (confidence >= 0.6) return "MEDIUM";
  return "LOW";
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getConflictType(similarity: number): "NEW" | "COEXIST" | "UPDATE" | "DUPLICATE" {
  if (similarity > 0.95) return "DUPLICATE";
  if (similarity >= 0.85) return "UPDATE";
  if (similarity >= 0.7) return "COEXIST";
  return "NEW";
}

function formatNode(n: typeof knowledgeNodesTable.$inferSelect) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    content: n.content,
    importance: n.importance,
    confidence: n.confidence,
    status: n.status,
    level: n.level,
    department: n.department ?? null,
    rationale: n.rationale ?? null,
    patientId: n.patientId ?? null,
    doctorId: n.doctorId ?? null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

function formatCandidate(c: typeof captureCandidatesTable.$inferSelect) {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    content: c.content,
    importance: c.importance,
    confidence: c.confidence,
    confidenceTier: c.confidenceTier,
    suggestedLevel: c.suggestedLevel,
    department: c.department,
    rationale: c.rationale,
    patientId: c.patientId,
    doctorId: c.doctorId,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

// POST /extract
router.post("/extract", async (req, res) => {
  const parsed = ExtractKnowledgeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { transcript, patientId, doctorId } = parsed.data;

  const existingNodes = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.patientId, patientId));
  const contextStr = existingNodes.map((n) => `[${n.type}] ${n.title}: ${n.content}`).join("\n");

  const extracted = await extractKnowledgeFromTranscript(transcript, contextStr);

  const inserted = [];
  for (const item of extracted) {
    const tier = getConfidenceTier(item.confidence);
    const [candidate] = await db.insert(captureCandidatesTable).values({
      type: item.type,
      title: item.title,
      content: item.content,
      importance: item.importance,
      confidence: item.confidence,
      confidenceTier: tier,
      suggestedLevel: item.suggested_level,
      department: item.department,
      rationale: item.rationale,
      patientId,
      doctorId,
      status: "PENDING",
    }).returning();

    await db.insert(eventLogTable).values({
      eventType: "CAPTURE_DETECTED",
      candidateId: candidate.id,
      doctorId,
      patientId,
      metadata: { confidenceTier: tier, type: item.type },
    });

    inserted.push(formatCandidate(candidate));
  }

  return res.json(inserted);
});

// POST /detect-conflicts
router.post("/detect-conflicts", async (req, res) => {
  const parsed = DetectConflictsBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { candidateId } = parsed.data;
  const [candidate] = await db.select().from(captureCandidatesTable).where(eq(captureCandidatesTable.id, candidateId));
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const candidateEmbedding = await generateEmbedding(`${candidate.title} ${candidate.content}`);
  const allNodes = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.status, "ACTIVE"));

  let bestSimilarity = 0;
  let bestNode: typeof knowledgeNodesTable.$inferSelect | null = null;

  for (const node of allNodes) {
    if (!node.embedding) continue;
    try {
      const nodeEmbedding: number[] = JSON.parse(node.embedding);
      const sim = cosineSimilarity(candidateEmbedding, nodeEmbedding);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestNode = node;
      }
    } catch {
      // skip malformed embeddings
    }
  }

  const conflictType = getConflictType(bestSimilarity);

  return res.json({
    candidateId,
    conflictType,
    similarity: bestSimilarity,
    existingNode: bestNode ? formatNode(bestNode) : null,
  });
});

// POST /confirm-node
router.post("/confirm-node", async (req, res) => {
  const parsed = ConfirmNodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { candidateId, editedType, editedTitle, editedContent, editedRationale } = parsed.data;
  const [candidate] = await db.select().from(captureCandidatesTable).where(eq(captureCandidatesTable.id, candidateId));
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const finalType = editedType ?? candidate.type;
  const finalTitle = editedTitle ?? candidate.title;
  const finalContent = editedContent ?? candidate.content;
  const finalRationale = editedRationale ?? candidate.rationale;

  const embedding = await generateEmbedding(`${finalTitle} ${finalContent}`);
  const tier = candidate.confidenceTier;
  const status = tier === "HIGH" ? "PENDING_CONFIRMATION" : "ACTIVE";

  const [node] = await db.insert(knowledgeNodesTable).values({
    type: finalType,
    title: finalTitle,
    content: finalContent,
    importance: candidate.importance,
    confidence: candidate.confidence,
    status,
    level: candidate.suggestedLevel,
    department: candidate.department,
    rationale: finalRationale,
    embedding: JSON.stringify(embedding),
    patientId: candidate.patientId,
    doctorId: candidate.doctorId,
  }).returning();

  await db.update(captureCandidatesTable).set({ status: "CONFIRMED" }).where(eq(captureCandidatesTable.id, candidateId));

  await db.insert(eventLogTable).values({
    eventType: "CAPTURE_CONFIRMED",
    candidateId,
    nodeId: node.id,
    doctorId: candidate.doctorId,
    patientId: candidate.patientId,
    metadata: { confidenceTier: tier, autoCapture: tier === "HIGH" },
  });

  return res.status(201).json(formatNode(node));
});

// POST /dismiss-node
router.post("/dismiss-node", async (req, res) => {
  const parsed = DismissNodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { candidateId } = parsed.data;
  const [candidate] = await db.select().from(captureCandidatesTable).where(eq(captureCandidatesTable.id, candidateId));
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  await db.update(captureCandidatesTable).set({ status: "DISMISSED" }).where(eq(captureCandidatesTable.id, candidateId));

  await db.insert(eventLogTable).values({
    eventType: "CAPTURE_DISMISSED",
    candidateId,
    doctorId: candidate.doctorId,
    patientId: candidate.patientId,
    metadata: {},
  });

  return res.json({ success: true, message: "Candidate dismissed" });
});

// POST /merge-node
router.post("/merge-node", async (req, res) => {
  const parsed = MergeNodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { candidateId, existingNodeId, mergedContent } = parsed.data;

  const [candidate] = await db.select().from(captureCandidatesTable).where(eq(captureCandidatesTable.id, candidateId));
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const [existing] = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.id, existingNodeId));
  if (!existing) {
    return res.status(404).json({ error: "Existing node not found" });
  }

  const finalContent = mergedContent ?? `${existing.content}\n\nUpdate: ${candidate.content}`;
  const newEmbedding = await generateEmbedding(`${existing.title} ${finalContent}`);

  const [updated] = await db.update(knowledgeNodesTable).set({
    content: finalContent,
    embedding: JSON.stringify(newEmbedding),
    status: "ACTIVE",
  }).where(eq(knowledgeNodesTable.id, existingNodeId)).returning();

  await db.update(captureCandidatesTable).set({ status: "MERGED" }).where(eq(captureCandidatesTable.id, candidateId));

  await db.insert(eventLogTable).values({
    eventType: "CAPTURE_MERGED",
    candidateId,
    nodeId: existingNodeId,
    doctorId: candidate.doctorId,
    patientId: candidate.patientId,
    metadata: { mergedInto: existingNodeId },
  });

  return res.json(formatNode(updated));
});

// POST /undo-node
router.post("/undo-node", async (req, res) => {
  const parsed = UndoNodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { nodeId } = parsed.data;
  const [node] = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.id, nodeId));
  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }

  const ageMs = Date.now() - node.createdAt.getTime();
  if (ageMs > 60000) {
    return res.status(400).json({ error: "Undo window expired (60 seconds)" });
  }

  await db.update(knowledgeNodesTable).set({ status: "DISMISSED" }).where(eq(knowledgeNodesTable.id, nodeId));

  await db.insert(eventLogTable).values({
    eventType: "CAPTURE_UNDONE",
    nodeId,
    metadata: { ageMs },
  });

  return res.json({ success: true, message: "Node undone successfully" });
});

export default router;
