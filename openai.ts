import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required. Set it in the Replit Secrets panel."
      );
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export interface ExtractedCandidate {
  type: "CONSTRAINT" | "DECISION" | "ANTI_PATTERN" | "FACT";
  title: string;
  content: string;
  importance: number;
  confidence: number;
  suggested_level: "patient" | "department" | "organization";
  department: string;
  rationale: string;
}

export async function extractKnowledgeFromTranscript(
  transcript: string,
  patientContext: string
): Promise<ExtractedCandidate[]> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a clinical knowledge extraction assistant. Extract structured knowledge nodes from doctor transcripts.

Return a JSON object with a "candidates" array. Each candidate must have:
- type: one of CONSTRAINT, DECISION, ANTI_PATTERN, FACT
- title: short descriptive title (max 80 chars)
- content: the full knowledge statement
- importance: float 0.0-1.0 (how clinically important)
- confidence: float 0.0-1.0 (how confident the extraction is)
- suggested_level: "patient", "department", or "organization"
- department: e.g. "ortho", "cardio", "general"
- rationale: why this was extracted

Node types:
- CONSTRAINT: a hard rule or contraindication ("Never give X to patients with Y")
- DECISION: a treatment choice or clinical decision made
- ANTI_PATTERN: a pattern to avoid ("Avoid doing X because Y")
- FACT: a clinical fact or observation about the patient

Patient context nodes (existing knowledge):
${patientContext}`,
      },
      {
        role: "user",
        content: `Extract knowledge nodes from this transcript:\n\n${transcript}`,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.candidates ?? [];
}
