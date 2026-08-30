import OpenAI from "openai";

// Groq exposes an OpenAI-compatible /v1/chat/completions endpoint,
// so we reuse the official OpenAI SDK and just point it at Groq's base URL.
// Free tier — no billing required to start. Get a key at https://console.groq.com/keys
export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
