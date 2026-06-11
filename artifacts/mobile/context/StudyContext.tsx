import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Question {
  id: string;
  question: string;
  answer: string;
  subject: string;
  language: "en" | "hi";
  createdAt: number;
  saved: boolean;
}

interface StudyContextValue {
  questions: Question[];
  savedQuestions: Question[];
  streak: number;
  badges: number;
  isAsking: boolean;
  apiKey: string;
  setApiKey: (key: string) => Promise<void>;
  askQuestion: (question: string, subject: string, language: "en" | "hi", deep?: boolean) => Promise<Question | null>;
  scanImage: (base64: string, mimeType: string) => Promise<string>;
  toggleSave: (id: string) => void;
  deleteQuestion: (id: string) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

const STORAGE_KEY = "study_questions_v1";
const STREAK_KEY = "study_streak_v1";
const LAST_DATE_KEY = "study_last_date_v1";
const BADGES_KEY = "study_badges_v1";
const API_KEY_STORAGE = "groq_api_key_v1";

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState(0);
  const [isAsking, setIsAsking] = useState(false);
  const [apiKey, setApiKeyState] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [raw, rawStreak, rawBadges, rawKey] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STREAK_KEY),
          AsyncStorage.getItem(BADGES_KEY),
          AsyncStorage.getItem(API_KEY_STORAGE),
        ]);
        if (raw) setQuestions(JSON.parse(raw) as Question[]);
        if (rawStreak) setStreak(parseInt(rawStreak, 10));
        if (rawBadges) setBadges(parseInt(rawBadges, 10));
        if (rawKey) setApiKeyState(rawKey);
      } catch {}
    })();
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    setApiKeyState(key);
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
  }, []);

  const persist = useCallback(async (qs: Question[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(qs));
  }, []);

  const updateStreak = useCallback(async () => {
    try {
      const today = new Date().toDateString();
      const last = await AsyncStorage.getItem(LAST_DATE_KEY);
      if (last === today) return;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = last === yesterday ? streak + 1 : 1;
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
    } catch {}
  }, [streak]);

  const getBaseUrl = () => {
    const domain = process.env["EXPO_PUBLIC_DOMAIN"];
    return domain ? `https://${domain}` : "";
  };

  const buildHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) h["X-Groq-Key"] = apiKey;
    return h;
  }, [apiKey]);

  const fetchWithTimeout = useCallback(
    async (url: string, options: RequestInit, timeoutMs = 45000): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    },
    []
  );

  const askQuestion = useCallback(
    async (question: string, subject: string, language: "en" | "hi", deep = false): Promise<Question | null> => {
      setIsAsking(true);
      const url = `${getBaseUrl()}/api/study/ask`;
      const body = JSON.stringify({ question, subject, language, deep });

      try {
        const res = await fetchWithTimeout(url, { method: "POST", headers: buildHeaders(), body });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
          throw new Error(errData.error ?? `Error ${res.status}`);
        }
        const data = (await res.json()) as { answer: string; subject: string };

        const newQ: Question = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          question: question.trim(),
          answer: data.answer,
          subject: data.subject,
          language,
          createdAt: Date.now(),
          saved: false,
        };

        setQuestions((prev) => {
          const next = [newQ, ...prev];
          persist(next);
          return next;
        });

        const total = questions.length + 1;
        const milestones = [1, 5, 10, 25, 50, 100];
        if (milestones.includes(total)) {
          const nb = badges + 1;
          setBadges(nb);
          AsyncStorage.setItem(BADGES_KEY, String(nb));
        }

        await updateStreak();
        return newQ;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("aborted") || msg.includes("abort")) {
          throw new Error("Request timed out. Please try again.");
        }
        throw new Error(msg || "Could not reach the server.");
      } finally {
        setIsAsking(false);
      }
    },
    [questions.length, badges, persist, updateStreak, fetchWithTimeout, buildHeaders]
  );

  const scanImage = useCallback(
    async (base64: string, mimeType: string): Promise<string> => {
      const url = `${getBaseUrl()}/api/study/ocr`;
      const body = JSON.stringify({ image: base64, mimeType });
      const res = await fetchWithTimeout(url, { method: "POST", headers: buildHeaders(), body }, 30000);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "OCR failed" })) as { error?: string };
        throw new Error(errData.error ?? "OCR failed");
      }
      const data = (await res.json()) as { text: string };
      return data.text ?? "";
    },
    [fetchWithTimeout, buildHeaders]
  );

  const toggleSave = useCallback(
    (id: string) => {
      setQuestions((prev) => {
        const next = prev.map((q) => (q.id === id ? { ...q, saved: !q.saved } : q));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const deleteQuestion = useCallback(
    (id: string) => {
      setQuestions((prev) => {
        const next = prev.filter((q) => q.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const savedQuestions = questions.filter((q) => q.saved);

  return (
    <StudyContext.Provider
      value={{ questions, savedQuestions, streak, badges, isAsking, apiKey, setApiKey, askQuestion, scanImage, toggleSave, deleteQuestion }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
