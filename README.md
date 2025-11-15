# Varquill — AI Judge Prototype

This repository contains a prototype of the Varquill system: a Next.js App Router frontend + API backend that lets two lawyers upload a case, exchange arguments, and request an AI judge verdict.

**Features:**
- Three-column UI: Lawyer A/B chat, Judge verdict panel, file upload
- API routes: `/api/upload`, `/api/verdict`, `/api/argument`, `/api/rag`
- MongoDB + Mongoose for data persistence
- LLM integration: Google Gemini 2.5 Flash with structured JSON output
- RAG skeleton: document storage and retrieval for legal precedents

## Quick Start

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Create `.env.local`:

3. **Start dev server**

```bash
npm run dev
```

Open http://localhost:3000 to use the UI.

## Varquill — AI Judge Prototype (TL;DR)

Varquill is a mock-trial simulation system that lets two virtual lawyers upload case files (PDF/DOCX/TXT), exchange arguments across multiple rounds, and request an impartial AI Judge to evaluate the case and return a verdict with reasoning and a confidence score. All case memory (initial filings, exchanged arguments, and verdicts) is persisted and used to re-evaluate the judge's decision as new arguments arrive.

This repository provides a runnable prototype built with Next.js (frontend + API routes), a simple persistence layer (JSON file fallback and optional Prisma+Postgres), and an LLM integration helper (OpenAI-compatible with a safe mock fallback).

## 1) Project Summary

- What AI Judge does: orchestrates a simulated legal debate where two lawyers (A and B) present documents and short arguments; an AI judge reads the full context and returns a verdict, reasoning, and a confidence score.
- How two lawyers upload case files: the frontend accepts PDF/DOCX/TXT uploads, extracts text server-side, and creates a case record that pre-fills lawyer inputs.
- How the AI judge gives verdicts: the backend assembles case facts + all prior arguments into a prompt, calls an LLM (OpenAI by default), and stores the structured verdict; a mock response is used when no API key is configured.
- How follow-up arguments work: either lawyer can submit short arguments; each submission is appended to case memory and triggers a re-evaluation by the AI judge.
- How memory is stored and used: case text, arguments, and verdicts are persisted in the database (Prisma/Postgres if `DATABASE_URL` is set, otherwise a local JSON file). The memoryService rebuilds the LLM context from stored records for each verdict request.
- Mock-trial simulation: the system is a simulation tool — outputs are intended for prototyping and demonstration, not legal advice.

## 2) Full Feature List

- File uploads (PDF / DOCX / TXT)
- Automatic server-side text extraction (pdf-parse, mammoth)
- Initial verdict generation from case text + initial filings
- Memory-based re-evaluated verdicts when arguments are added
- Up to 5 argument rounds shown in the UI (configurable)
- Three-column UI (Lawyer A, Judge, Lawyer B)
- Judge reasoning + confidence score output
- Summarization hooks for long cases (prevent token overflow)
- RAG skeleton (document store + naive retrieval) included

## 3) Architecture (text diagram)

Frontend (Next.js App Router)
	 ├── Upload documents
	 ├── Lawyer A/B chat
	 └── Judge verdict panel
				|
API Routes (Next.js Backend)
	 ├── /api/upload        → extract text, create case
	 ├── /api/verdict       → request initial / re-evaluated verdict
	 ├── /api/argument      → append argument + re-evaluate
	 └── /api/rag           → document store + retrieval
				|
Database (MongoDB / Mongoose or JSON fallback)
	 ├── cases
	 ├── arguments
	 ├── verdicts
	 └── documents
				|
AI Layer (OpenAI GPT-4 / mock)

## 4) Tech Stack

- Next.js 13.5+ (App Router for frontend + API routes)
- React 18.2+
- Tailwind CSS 3.4+ (configured with PostCSS)
- MongoDB + Mongoose (production) — local JSON fallback for quick prototyping
- OpenAI API (LLM) with mock fallback
- pdf-parse, mammoth for PDF/DOCX/TXT extraction
- formidable for multipart file uploads

## 5) Folder Structure

This project uses the Next.js App Router architecture:

```
/app
  layout.js                    # Root layout with metadata
  page.js                      # Main three-column UI (client component)
  /api/upload/route.js         # File upload & case creation
  /api/verdict/route.js        # Initial & re-evaluated verdicts
  /api/argument/route.js       # Append argument + re-evaluate
  /api/rag/route.js            # Document storage & retrieval
/components
  ChatBox.js                   # Lawyer argument submission UI
  JudgePanel.js                # Verdict request & display
  UploadBox.js                 # File upload interface
  ProgressBar.js               # Round counter display
/lib
  dbConnect.js                 # Mongoose connection helper
  db.js                        # Unified data access layer
  aiService.js                 # OpenAI integration & prompts
  extractService.js            # PDF/DOCX/TXT text extraction
  rag.js                       # Document storage & retrieval
/models
  Case.js                      # Mongoose schema for cases
  Argument.js                  # Mongoose schema for arguments
  Verdict.js                   # Mongoose schema for verdicts
  Document.js                  # Mongoose schema for RAG docs
/styles
  globals.css                  # Tailwind imports & global styles
/tests
  db.test.js                   # Database layer unit tests
  llm.test.js                  # LLM helper unit tests
```

## 6) Installation

```bash
git clone <your-repo-url>
cd ai-judge
npm install
cp .env.example .env.local    # or create your own .env.local
npm run dev
```

Open http://localhost:3000

## 7) Environment Variables

Example `.env.local`:

## 8) API Endpoints (examples)

1) POST /api/upload
 - Description: upload a file (multipart) or POST JSON { text: 'A text\n---\nB text' }
 - Request (JSON): { "text": "Lawyer A filing...\n---\nLawyer B filing..." }
 - Request (multipart, TODO): file field named `file`
 - Response example:

```json
{ "case_id": "uuid-...", "extracted_text": "...extracted text..." }
```

2) GET /api/verdict?caseId=<id>
 - Description: fetch current case state with arguments
 - Response example:

```json
{
  "caseText": "...",
  "arguments": [
    { "side": "Lawyer A", "text": "...", "round": 1 }
  ],
  "lastVerdict": { "verdict": "...", "confidence": 75, "reasoning": "..." }
}
```

3) POST /api/verdict
 - Description: request an initial or updated verdict for a case
 - Request body: { "caseId": "<id>" }
 - Response example:

```json
{
  "verdict": "Favor Lawyer A",
  "confidence": 72,
  "reasoning": "...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

4) POST /api/argument
 - Description: append an argument and ask the judge to re-evaluate
 - Request body: { "caseId": "<id>", "side": "Lawyer A|Lawyer B", "text": "...argument..." }
 - Response example:

```json
{
  "verdict": "Favor Lawyer A",
  "confidence": 65,
  "reasoning": "...",
  "arguments": [
    { "side": "Lawyer A", "text": "...", "round": 1 },
    { "side": "Lawyer B", "text": "...", "round": 1 }
  ]
}
```

5) GET /api/rag
 - Description: list all documents in RAG store
 - Response example:

```json
{
  "documents": [
    { "_id": "...", "title": "Precedent A", "text": "..." }
  ]
}
```

6) GET /api/rag?query=contract+law
 - Description: retrieve relevant documents based on query
 - Response example:

```json
{
  "documents": [
    { "_id": "...", "title": "Contract Law Basics", "text": "...", "score": 3 }
  ]
}
```

7) POST /api/rag
 - Description: add a new document to RAG store
 - Request body: { "title": "...", "text": "..." }
 - Response example:

```json
{
  "id": "...",
  "message": "Document stored successfully"
}
```

## 9) How Memory Works (important)

- How case data is stored: each case record stores extracted file text and initial filings. When MongoDB is enabled (via `MONGODB_URI`), records are saved in MongoDB using Mongoose models. Otherwise the repo writes to `data/db.json`.
- How arguments & verdicts are persisted: each submitted argument is appended to the `arguments` collection (or JSON array) with a round number; each verdict is stored in the `verdicts` collection with a timestamp and confidence.
- How the system rebuilds context: for every verdict request the backend fetches the case text, all arguments in chronological order, and recent verdict history. It then builds a concise prompt that contains only the necessary information (case facts + latest arguments) to keep token usage small.
- How summarization prevents token overflow: for very long cases the system can run a summarization step before sending context to the LLM (via `aiService.summarizeIfNeeded()`). The summarizer reduces earlier parts of the case to a compact summary which are stored as auxiliary summaries; this lets the judge reason over the whole case without hitting token limits.
- RAG document retrieval: the `/api/rag` endpoint allows storing legal precedents and case documents. The `rag.js` service implements naive token-based retrieval that can be upgraded to vector embeddings for semantic search.

Practical tip: keep argument messages short and rely on summarization or RAG retrieval for long precedent documents.

## 10) Deployment Guide

### Quick Deploy to Vercel:

1. **Setup MongoDB Atlas:**
   - Create free cluster at https://cloud.mongodb.com
   - Set Network Access to "Allow from Anywhere" (0.0.0.0/0)
   - Get connection string

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Deploy to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Add environment variables:
     - `GEMINI_API_KEY`
     - `MONGODB_URI`
   - Click Deploy

4. **Verify:**
   - Upload a test case
   - Request verdict
   - Refresh browser - case should persist ✅

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 11) Future Improvements

- Complete multipart file upload handling in `/api/upload` route
- RAG-based legal precedent retrieval with vector embeddings (Pinecone, Weaviate, or MongoDB Atlas Vector Search)
- Better judge persona tuning and safety filters (reduce hallucinations and bias)
- Bias analysis suite to detect potential unfairness in verdicts
- Auth + multi-case dashboard for users and role-based access
- Real-time updates with WebSockets or server-sent events for live argument streams
- Audit logs and exportable transcripts for each mock trial
- Integration tests for all API endpoints using node fetch or Next.js test utilities

---

**Note**: This prototype currently uses Mongoose + MongoDB (with JSON fallback). Prisma artifacts from an earlier version are still present in the codebase and may be removed in future updates.
