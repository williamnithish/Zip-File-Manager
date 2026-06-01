import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/openai", (_req, res) => {
  const configured = !!process.env.OPENAI_API_KEY;
  res.json({ configured, status: configured ? "ready" : "missing_key" });
});

export default router;
