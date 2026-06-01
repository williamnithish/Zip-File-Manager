import { Router } from "express";
import { db, knowledgeNodesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListKnowledgeNodesQueryParams,
  GetKnowledgeNodeParams,
  UpdateKnowledgeNodeParams,
  UpdateKnowledgeNodeBody,
  SemanticSearchNodesBody,
} from "@workspace/api-zod";
import { generateEmbedding } from "../lib/openai";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const router = Router();

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

// Must be before /:nodeId so Express doesn't treat "search" as a nodeId
router.post("/search", async (req, res) => {
  const bodyParsed = SemanticSearchNodesBody.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { query, topK = 10 } = bodyParsed.data;

  const queryVec = await generateEmbedding(query);

  const allNodes = await db.select().from(knowledgeNodesTable);

  const scored = allNodes
    .filter(n => n.embedding != null)
    .map(n => {
      let vec: number[];
      try { vec = JSON.parse(n.embedding!); } catch { return null; }
      return { node: n, similarity: cosineSimilarity(queryVec, vec) };
    })
    .filter((x): x is { node: typeof allNodes[0]; similarity: number } => x !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return res.json(scored.map(({ node, similarity }) => ({ node: formatNode(node), similarity })));
});

router.get("/", async (req, res) => {
  const queryParsed = ListKnowledgeNodesQueryParams.safeParse(req.query);
  const params = queryParsed.success ? queryParsed.data : {};

  const conditions = [];
  if (params.patientId != null) conditions.push(eq(knowledgeNodesTable.patientId, params.patientId));
  if (params.doctorId != null) conditions.push(eq(knowledgeNodesTable.doctorId, params.doctorId));
  if (params.department) conditions.push(eq(knowledgeNodesTable.department, params.department));
  if (params.type) conditions.push(eq(knowledgeNodesTable.type, params.type));
  if (params.status) conditions.push(eq(knowledgeNodesTable.status, params.status));

  const nodes = conditions.length > 0
    ? await db.select().from(knowledgeNodesTable).where(and(...conditions))
    : await db.select().from(knowledgeNodesTable);

  return res.json(nodes.map(formatNode));
});

router.get("/:nodeId", async (req, res) => {
  const paramsParsed = GetKnowledgeNodeParams.safeParse({ nodeId: parseInt(req.params.nodeId) });
  if (!paramsParsed.success) {
    return res.status(400).json({ error: "Invalid node ID" });
  }

  const [node] = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.id, paramsParsed.data.nodeId));
  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }

  return res.json(formatNode(node));
});

router.patch("/:nodeId", async (req, res) => {
  const paramsParsed = UpdateKnowledgeNodeParams.safeParse({ nodeId: parseInt(req.params.nodeId) });
  if (!paramsParsed.success) {
    return res.status(400).json({ error: "Invalid node ID" });
  }

  const bodyParsed = UpdateKnowledgeNodeBody.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const updates: Record<string, unknown> = {};
  const body = bodyParsed.data;
  if (body.type != null) updates.type = body.type;
  if (body.title != null) updates.title = body.title;
  if (body.importance != null) updates.importance = body.importance;
  if (body.rationale != null) updates.rationale = body.rationale;
  if (body.status != null) updates.status = body.status;

  if (body.content != null) {
    updates.content = body.content;
    const [current] = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.id, paramsParsed.data.nodeId));
    if (current) {
      const newEmbedding = await generateEmbedding(`${body.title ?? current.title} ${body.content}`);
      updates.embedding = JSON.stringify(newEmbedding);
    }
  }

  const [updated] = await db
    .update(knowledgeNodesTable)
    .set(updates)
    .where(eq(knowledgeNodesTable.id, paramsParsed.data.nodeId))
    .returning();

  if (!updated) {
    return res.status(404).json({ error: "Node not found" });
  }

  return res.json(formatNode(updated));
});

export default router;
