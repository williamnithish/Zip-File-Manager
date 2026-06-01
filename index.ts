import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import doctorsRouter from "./doctors";
import captureRouter from "./capture";
import knowledgeRouter from "./knowledge";
import summaryRouter from "./summary";
import transcribeRouter from "./transcribe";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/patients", patientsRouter);
router.use("/doctors", doctorsRouter);
router.use("/knowledge-nodes", knowledgeRouter);
router.use(captureRouter);
router.use(summaryRouter);
router.use(transcribeRouter);

export default router;
