# AIStudyHelper

An AI-powered mobile study app for students — ask questions, scan textbooks, and get instant step-by-step answers in Hindi and English.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo app
- `pnpm --filter @workspace/mobile run typecheck` — typecheck the app
- `pnpm --filter @workspace/api-server run typecheck` — typecheck the server

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **API**: Express 5, Groq SDK via fetch (no SDK, raw REST)
- **Mobile**: Expo 54, Expo Router v6, React Native 0.81
- **Storage**: AsyncStorage (no database — all local on device)
- **AI**: Groq API (`llama-3.1-8b-instant` standard, `llama-3.3-70b-versatile` deep research)
- **OCR**: Groq Vision API (`meta-llama/llama-4-scout-17b-16e-instruct`) — same key as AI

## Where things live

- `artifacts/api-server/src/routes/study.ts` — AI + OCR endpoints (source of truth for API)
- `artifacts/mobile/context/StudyContext.tsx` — all state, API calls, persistence
- `artifacts/mobile/app/(tabs)/` — all 5 screens (index, ask, saved, profile, settings)
- `artifacts/mobile/components/StepAnswer.tsx` — step-by-step answer renderer
- `artifacts/mobile/components/QuestionCard.tsx` — saved answer card with copy/share

## Architecture decisions

- **API key stored on device (AsyncStorage)** — users enter their own free Groq key in Settings; it's sent as `X-Groq-Key` header; server falls back to `process.env.GROQ_API_KEY` if header is absent.
- **Same key for AI + OCR** — Groq Vision handles both text answers and image OCR, so one key unlocks everything.
- **No database** — all history lives in AsyncStorage on the user's device. Simple, private, offline-capable.
- **Body limit 8MB** — required for base64 image payloads in OCR requests.
- **Deep Research mode** — switches to `llama-3.3-70b-versatile` with a more detailed system prompt for thorough multi-angle explanations.

## Product

- **4 subjects**: Mathematics, Science, English, Social Studies (+ General)
- **Camera & Gallery upload** → OCR scans text from photos of textbooks/worksheets
- **Auto question detection** — OCR result auto-fills the question input
- **Step-by-step AI answers** — consistent Step 1/2/3 + Key Points + The Answer format
- **Deep Research mode** — longer, more detailed explanations using 70B model
- **Hindi & English** — full bilingual support
- **History & Saved** — all questions saved locally; bookmark to Saved tab
- **Copy, Share, Download** — share or download any answer
- **Settings screen** — enter/test/clear Groq API key + instructions

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Never call Groq directly from mobile** — always proxy through the Express API server so the key isn't exposed in bundles.
- **Image quality 0.5** — expo-image-picker picks at quality 0.5 to keep base64 payloads small; 8MB Express limit accommodates this.
- **expo-clipboard installed** — `expo-clipboard` added to `artifacts/mobile`; use `Clipboard.setStringAsync`.
- Server body limit is `8mb` (set in `app.ts`) — required for OCR base64 images.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
