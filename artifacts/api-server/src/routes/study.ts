import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.0-flash-001";

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

  const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"];
  if (!OPENROUTER_API_KEY) {
    res.status(500).json({ error: "OPENROUTER_API_KEY is not configured" });
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
    const openrouterRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "AIStudyHelper",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question.trim() },
        ],
        max_tokens: 1024,
      }),
    });

    if (!openrouterRes.ok) {
      const errText = await openrouterRes.text();
      logger.error({ status: openrouterRes.status, errText }, "OpenRouter error");
      res.status(502).json({ error: "AI service error" });
      return;
    }

    const data = (await openrouterRes.json()) as {
      choices: { message: { content: string } }[];
    };

    const answer = data.choices?.[0]?.message?.content ?? "";
    res.json({ answer, subject: subject ?? "General" });
  } catch (err) {
    logger.error({ err }, "OpenRouter fetch failed");
    res.status(500).json({ error: "Failed to get AI answer" });
  }
});

export default router;
