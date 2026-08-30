# Visa Advisor Chatbot

An AI chatbot that recommends countries/visa pathways based on a user's interests
(study, work, travel, migration, budget, timeline) and walks them through the
**end-to-end visa process** for the chosen country — using live web search so
fees, documents, and processing times stay current.

## Architecture

```
User -> LLM (Groq, Llama 3.3 70B) -> Output
              +
         Tool calling -> SerpAPI (Google results)
```

- **LLM**: [Groq](https://console.groq.com) — free tier, OpenAI-compatible API,
  very fast inference, `llama-3.3-70b-versatile` (supports native tool/function
  calling).
- **Tool calling**: the model is given one tool, `web_search`. When it needs
  current facts (visa fees, processing times, document checklists, policy
  changes) it emits a `tool_call`, our API route executes a Google search via
  **SerpAPI** (free tier: 100 searches/month), and feeds the results back to
  the model so it can ground its final answer.
- **Frontend**: Next.js App Router + React, a simple chat UI.
- **Backend**: a single Next.js API route (`/api/chat`) that runs the
  request → tool-call → tool-result → final-answer loop server-side, so your
  API keys never reach the browser.

## Project structure

```
visa-chatbot/
├── app/
│   ├── page.tsx              # Chat page
│   ├── layout.tsx
│   ├── globals.css
│   └── api/chat/route.ts     # LLM + tool-calling loop
├── components/
│   ├── ChatWindow.tsx        # Chat state + fetch logic
│   └── MessageBubble.tsx     # Message rendering
├── lib/
│   ├── groq.ts                # Groq client (OpenAI SDK, custom baseURL)
│   ├── tools.ts               # web_search tool schema + SerpAPI executor
│   └── systemPrompt.ts        # Visa-advisor persona/instructions
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
└── .gitignore
```

## 1. Get free API keys

1. **Groq** (LLM, free): https://console.groq.com/keys — sign up, create an
   API key.
2. **SerpAPI** (web search, free tier): https://serpapi.com/manage-api-key —
   sign up, copy your API key (100 free searches/month).

## 2. Run locally

```bash
git clone <your-repo-url>
cd visa-chatbot
npm install
cp .env.example .env.local
# then edit .env.local and paste in your GROQ_API_KEY and SERPAPI_KEY
npm run dev
```

Open http://localhost:3000.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: visa advisor chatbot"
git branch -M main
git remote add origin https://github.com/<your-username>/visa-chatbot.git
git push -u origin main
```

## 4. Deploy to Vercel

**Option A — Vercel dashboard (recommended, no CLI needed):**

1. Go to https://vercel.com/new and sign in with GitHub.
2. Click **Import** next to your `visa-chatbot` repo.
3. Framework preset: Vercel auto-detects **Next.js** — leave defaults.
4. Expand **Environment Variables** and add:
   - `GROQ_API_KEY` = your Groq key
   - `SERPAPI_KEY` = your SerpAPI key
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (optional, this is the default)
5. Click **Deploy**. Vercel builds and gives you a live URL
   (`https://visa-chatbot-xxxx.vercel.app`) in about a minute.

**Option B — Vercel CLI:**

```bash
npm i -g vercel
vercel login
vercel            # first run: link/create the project, deploys a preview
vercel env add GROQ_API_KEY
vercel env add SERPAPI_KEY
vercel --prod     # deploy to production
```

That's it — the chatbot is live, with the LLM and SerpAPI keys kept
server-side (never exposed to the browser).

## Notes / next steps

- Swap `llama-3.3-70b-versatile` for another Groq model in `.env.local` if you
  want to experiment (any Groq model that supports tool calling works — check
  https://console.groq.com/docs/models).
- The tool-calling loop caps at 4 iterations (`MAX_TOOL_ITERATIONS` in
  `app/api/chat/route.ts`) to avoid runaway search loops — raise it if you
  want the model to chain more searches per turn.
- To persist chat history across sessions, add a database (e.g. Vercel KV or
  Postgres) — currently state is in-memory in the browser tab only.
- SerpAPI's free tier is capped at 100 searches/month; for heavier use,
  either upgrade or swap `lib/tools.ts` to a different search provider
  (e.g. Tavily, Brave Search API, or Bing Search API) with free tiers of
  their own.
