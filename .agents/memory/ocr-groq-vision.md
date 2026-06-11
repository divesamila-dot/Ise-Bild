---
name: OCR via Groq Vision
description: How image OCR is implemented using Groq Vision API in AIStudyHelper
---

OCR endpoint: `POST /api/study/ocr` accepts `{ image: base64string, mimeType: string }`.
Uses model `meta-llama/llama-4-scout-17b-16e-instruct` (supports vision).
Image sent as `data:${mimeType};base64,${image}` in the image_url content block.

**Why:** Groq Vision model can extract text from photos of textbooks/handwritten problems. Same Groq key as AI answers — no separate OCR service needed.

**How to apply:** Express body limit must be `8mb` (set in app.ts). Mobile should use `quality: 0.5` in expo-image-picker to keep payloads small. On error, show helpful message pointing user to Settings.
