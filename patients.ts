import { Router } from "express";
import { db, patientsTable, knowledgeNodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePatientBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const patients = await db.select().from(patientsTable).orderBy(patientsTable.name);
  return res.json(patients.map((p) => ({
    id: p.id,
    name: p.name,
    mrn: p.mrn,
    dateOfBirth: p.dateOfBirth ?? null,
    department: p.department ?? null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  const { name, mrn, dateOfBirth, department } = parsed.data;
  const [patient] = await db.insert(patientsTable).values({
    name,
    mrn,
    dateOfBirth: dateOfBirth ?? null,
    department: department ?? null,
  }).returning();
  return res.status(201).json({
    id: patient.id,
    name: patient.name,
    mrn: patient.mrn,
    dateOfBirth: patient.dateOfBirth ?? null,
    department: patient.department ?? null,
    createdAt: patient.createdAt.toISOString(),
  });
});

router.get("/:patientId/context", async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }
  const nodes = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.patientId, patientId));
  return res.json({
    patient: {
      id: patient.id,
      name: patient.name,
      mrn: patient.mrn,
      dateOfBirth: patient.dateOfBirth ?? null,
      department: patient.department ?? null,
      createdAt: patient.createdAt.toISOString(),
    },
    knowledgeNodes: nodes.map((n) => ({
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
    })),
  });
});

export default router;
