import { Router } from "express";
import { db, knowledgeNodesTable, eventLogTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/capture-summary", async (_req, res) => {
  const allNodes = await db.select().from(knowledgeNodesTable);

  const totalNodes = allNodes.length;
  const activeNodes = allNodes.filter((n) => n.status === "ACTIVE").length;
  const pendingNodes = allNodes.filter((n) => n.status === "PENDING_CONFIRMATION").length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCaptures = allNodes.filter((n) => n.createdAt >= todayStart).length;

  const typeCounts: Record<string, number> = {};
  for (const n of allNodes) {
    typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1;
  }
  const byType = Object.entries(typeCounts).map(([label, count]) => ({ label, count }));

  const deptCounts: Record<string, number> = {};
  for (const n of allNodes) {
    const dept = n.department ?? "general";
    deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
  }
  const byDepartment = Object.entries(deptCounts).map(([label, count]) => ({ label, count }));

  const tierCounts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const n of allNodes) {
    if (n.confidence > 0.85) tierCounts.HIGH = (tierCounts.HIGH ?? 0) + 1;
    else if (n.confidence >= 0.60) tierCounts.MEDIUM = (tierCounts.MEDIUM ?? 0) + 1;
    else tierCounts.LOW = (tierCounts.LOW ?? 0) + 1;
  }
  const byConfidenceTier = Object.entries(tierCounts).map(([label, count]) => ({ label, count }));

  const recentEvents = await db.select().from(eventLogTable).orderBy(desc(eventLogTable.createdAt)).limit(10);
  const recentActivity = recentEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    candidateId: e.candidateId ?? null,
    nodeId: e.nodeId ?? null,
    doctorId: e.doctorId ?? null,
    patientId: e.patientId ?? null,
    metadata: (e.metadata as Record<string, unknown>) ?? null,
    createdAt: e.createdAt.toISOString(),
  }));

  return res.json({ totalNodes, activeNodes, pendingNodes, todayCaptures, byType, byDepartment, byConfidenceTier, recentActivity });
});

router.get("/events", async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const events = await db.select().from(eventLogTable).orderBy(desc(eventLogTable.createdAt)).limit(limit);
  return res.json(events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    candidateId: e.candidateId ?? null,
    nodeId: e.nodeId ?? null,
    doctorId: e.doctorId ?? null,
    patientId: e.patientId ?? null,
    metadata: (e.metadata as Record<string, unknown>) ?? null,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
