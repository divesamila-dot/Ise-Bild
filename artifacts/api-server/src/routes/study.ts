import { type Request, Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_FAST = "llama-3.1-8b-instant";
const MODEL_DEEP = "llama-3.3-70b-versatile";
const MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";

function getKey(req: Request): string | undefined {
  return (req.headers["x-groq-key"] as string | undefined) || process.env["GROQ_API_KEY"];
}

async function groqChat(
  apiKey: string,
  model: string,
  messages: object[],
  maxTokens = 1024
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
      signal: controller.signal,
    });
    if (!r.ok) {
      const txt = await r.text();
      throw Object.assign(new Error(txt), { status: r.status });
    }
    const data = (await r.json()) as { choices: { message: { content: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}

// ── POST /api/study/ask ─────────────────────────────────────────────────────
router.post("/study/ask", async (req, res) => {
  const { question, subject, language, deep } = req.body as {
    question: string;
    subject?: string;
    language?: "en" | "hi";
    deep?: boolean;
  };

  if (!question?.trim()) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const apiKey = getKey(req);
  if (!apiKey) {
    res.status(500).json({ error: "No API key configured. Add your Groq key in Settings." });
    return;
  }

  const subjectCtx = subject ? `Subject: ${subject}. ` : "";
  const langInstr =
    language === "hi"
      ? "Answer in Hindi (हिंदी में उत्तर दें). Use clear, simple Hindi."
      : "Answer in clear, simple English.";

  const stdPrompt = `You are an expert AI study assistant for students. ${subjectCtx}${langInstr}

ALWAYS format your answer EXACTLY like this (no markdown, no asterisks, no bold):

Here's a step-by-step breakdown:

Step 1: [first concept or action]
Step 2: [next concept or action]
Step 3: [continue as needed]

Key Points:
- [key thing to remember]
- [another key point]

The Answer is: [final concise answer]

Rules: Use "Step N:" prefix. No **, *, or # symbols. Simple student-friendly language.`;

  const deepPrompt = `You are a comprehensive research assistant for students. ${subjectCtx}${langInstr}

Provide a THOROUGH, DETAILED explanation. Format EXACTLY like this (no markdown, no asterisks):

Here's a step-by-step breakdown:

Step 1: [Core concept / definition]
Step 2: [Detailed explanation or derivation]
Step 3: [Alternative approach or method if applicable]
Step 4: [Real-world example or application]
Step 5: [Common mistakes to avoid]

Key Points:
- [Important formula, rule, or theorem]
- [Another key insight]
- [Exam tip or memory trick]

The Answer is: [Complete, thorough final answer]

Be comprehensive. Cover all angles. Use simple but complete explanations.`;

  try {
    const model = deep ? MODEL_DEEP : MODEL_FAST;
    const systemPrompt = deep ? deepPrompt : stdPrompt;
    const answer = await groqChat(apiKey, model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: question.trim() },
    ], deep ? 2048 : 1024);

    res.json({ answer: answer.trim(), subject: subject ?? "General" });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    logger.error({ err, status }, "Groq ask error");
    if (status === 401) {
      res.status(401).json({ error: "Invalid API key. Please update it in Settings." });
    } else {
      res.status(502).json({ error: "AI service error. Please try again." });
    }
  }
});

// ── POST /api/study/ocr ─────────────────────────────────────────────────────
router.post("/study/ocr", async (req, res) => {
  const { image, mimeType = "image/jpeg" } = req.body as {
    image?: string;
    mimeType?: string;
  };

  if (!image) {
    res.status(400).json({ error: "image is required" });
    return;
  }

  const apiKey = getKey(req);
  if (!apiKey) {
    res.status(500).json({ error: "No API key configured. Add your Groq key in Settings." });
    return;
  }

  try {
    const text = await groqChat(
      apiKey,
      MODEL_VISION,
      [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${image}` },
            },
            {
              type: "text",
              text: "Extract ALL text visible in this image exactly as written. If it's a math problem or question, write it out clearly. Return ONLY the extracted text, nothing else.",
            },
          ],
        },
      ],
      512
    );

    res.json({ text: text.trim() });
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    logger.error({ err, status }, "Groq OCR error");
    if (status === 401) {
      res.status(401).json({ error: "Invalid API key." });
    } else {
      res.status(502).json({ error: "OCR service error. Please try again." });
    }
  }
});

export default router;
