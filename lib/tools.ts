import type OpenAI from "openai";

// ---- Tool schema exposed to the LLM ----
// This is what teaches the model *when* and *how* to call SerpAPI.
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search Google for current, up-to-date information. Use this whenever you need " +
        "live facts you cannot be fully certain about from memory — e.g. current visa " +
        "fees, processing times, required documents, embassy links, eligibility rule " +
        "changes, or country-specific immigration policy updates. Always search before " +
        "giving specific visa fees, processing times, or procedural steps, since these " +
        "change frequently.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The Google search query, e.g. 'Germany Job Seeker Visa requirements 2026' " +
              "or 'Canada Express Entry processing time'.",
          },
        },
        required: ["query"],
      },
    },
  },
];

interface SerpOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
}

// ---- Tool executor ----
// Called by our API route whenever the LLM emits a tool_call for "web_search".
export async function executeWebSearch(query: string): Promise<string> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return "Web search is not configured (missing SERPAPI_KEY). Answer from existing knowledge and tell the user to verify current details on the relevant government immigration website.";
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("engine", "google");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", "5");

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      return `Search failed with status ${res.status}. Answer from existing knowledge and note the info may not be fully current.`;
    }
    const data = await res.json();

    const organic: SerpOrganicResult[] = data.organic_results || [];
    const answerBox = data.answer_box;

    const parts: string[] = [];

    if (answerBox) {
      const boxText =
        answerBox.snippet || answerBox.answer || answerBox.result || "";
      if (boxText) parts.push(`Featured answer: ${boxText}`);
    }

    organic.slice(0, 5).forEach((r, i) => {
      if (r.title || r.snippet) {
        parts.push(
          `[${i + 1}] ${r.title || ""}\n${r.snippet || ""}\nSource: ${
            r.link || ""
          }`
        );
      }
    });

    if (parts.length === 0) {
      return "No relevant search results found. Answer from existing knowledge and note the info may not be fully current.";
    }

    return parts.join("\n\n");
  } catch (err) {
    return `Search request failed: ${
      (err as Error).message
    }. Answer from existing knowledge and note the info may not be fully current.`;
  }
}
