import { Router } from "express";
import { db, doctorsTable, knowledgeNodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDoctorBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.name);
  return res.json(doctors.map((d) => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty ?? null,
    email: d.email ?? null,
    createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  const { name, specialty, email } = parsed.data;
  const [doctor] = await db.insert(doctorsTable).values({
    name,
    specialty: specialty ?? null,
    email: email ?? null,
  }).returning();
  return res.status(201).json({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty ?? null,
    email: doctor.email ?? null,
    createdAt: doctor.createdAt.toISOString(),
  });
});

router.get("/:doctorId/context", async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  if (isNaN(doctorId)) {
    return res.status(400).json({ error: "Invalid doctor ID" });
  }
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId));
  if (!doctor) {
    return res.status(404).json({ error: "Doctor not found" });
  }
  const nodes = await db.select().from(knowledgeNodesTable).where(eq(knowledgeNodesTable.doctorId, doctorId));
  return res.json({
    doctor: {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty ?? null,
      email: doctor.email ?? null,
      createdAt: doctor.createdAt.toISOString(),
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
