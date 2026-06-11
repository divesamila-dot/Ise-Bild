import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

router.post("/study/ask", async (req, res) => {
  const { question, subject, language } = req.body as {
    question: string;
    subject?: string;
    language?: "en" | "hi";
  };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const GROQ_API_KEY = process.env["GROQ_API_KEY"];
  if (!GROQ_API_KEY) {
    res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    return;
  }

  const subjectContext = subject ? `Subject: ${subject}. ` : "";
  const langInstruction =
    language === "hi"
      ? "Answer in Hindi (हिंदी में उत्तर दें). Use clear, simple Hindi language."
      : "Answer in clear, simple English.";

  const systemPrompt = `You are an expert AI study assistant for students. ${subjectContext}${langInstruction}

ALWAYS format your answer EXACTLY like this structure (no markdown bold, no asterisks):

Here's a step-by-step breakdown:

Step 1: [first step or concept]
Step 2: [second step or concept]
Step 3: [third step or concept]
(add more steps if needed)

Key Points:
- [important thing to remember]
- [another key point]

The Answer is: [final concise answer or conclusion]

Rules:
- Use "Step N:" prefix (not numbers alone) for every step
- Keep each step short and clear — one idea per step
- End with "The Answer is:" followed by the final answer
- No markdown symbols like **, *, #
- Simple words a student can understand`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question.trim() },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!r.ok) {
      const errText = await r.text();
      logger.error({ status: r.status, errText }, "Groq error");
      res.status(502).json({ error: "AI service error" });
      return;
    }

    const data = (await r.json()) as {
      choices: { message: { content: string } }[];
    };

    const answer = data.choices?.[0]?.message?.content ?? "";
    res.json({ answer: answer.trim(), subject: subject ?? "General" });
  } catch (err) {
    logger.error({ err }, "Groq fetch failed");
    res.status(500).json({ error: "Failed to get AI answer" });
  }
});

export default router;
