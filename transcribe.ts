import { Router } from "express";
import multer from "multer";
import { toFile } from "openai";
import { getClient } from "../lib/openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const file = await toFile(req.file.buffer, req.file.originalname || "audio.webm", {
    type: req.file.mimetype || "audio/webm",
  });

  const response = await getClient().audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "en",
  });

  return res.json({ transcript: response.text });
});

export default router;
