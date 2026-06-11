---
name: Groq API key flow
description: How the Groq API key flows from user Settings to the server in AIStudyHelper
---

User enters key in Settings screen → saved to AsyncStorage key `groq_api_key_v1` → StudyContext loads on mount and stores in state → all fetch calls include `X-Groq-Key: <key>` header → server's `getKey(req)` reads header first, falls back to `process.env.GROQ_API_KEY`.

**Why:** Allows zero-config dev (env var) while letting end users bring their own free Groq key via Settings. Key never baked into app bundle.

**How to apply:** Any new server route that calls Groq must call `getKey(req)` and return 500 if undefined. Any new mobile API call in StudyContext must call `buildHeaders()` to include the key header.
