import { NextRequest, NextResponse } from "next/server";
import type OpenAI from "openai";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { tools, executeWebSearch } from "@/lib/tools";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const runtime = "nodejs";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const MAX_TOOL_ITERATIONS = 4;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingMessages: ChatMessage[] = body.messages || [];

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Server is missing GROQ_API_KEY." },
        { status: 500 }
      );
    }

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...incomingMessages,
    ];

    let finalMessage: OpenAI.Chat.Completions.ChatCompletionMessage | null =
      null;
    const toolTrace: { query: string }[] = [];

    // Tool-calling loop:
    // 1. Ask the LLM for a completion.
    // 2. If it wants to call a tool, execute it and feed the result back.
    // 3. Repeat until the LLM returns a plain text answer (or we hit the cap).
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.4,
      });

      const choice = completion.choices[0];
      const msg = choice.message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Record the assistant's tool-call request in the running transcript
        messages.push(msg);

        for (const toolCall of msg.tool_calls) {
          if (toolCall.function.name === "web_search") {
            let query = "";
            try {
              query = JSON.parse(toolCall.function.arguments).query;
            } catch {
              query = toolCall.function.arguments;
            }
            toolTrace.push({ query });

            const result = await executeWebSearch(query);

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          } else {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Unknown tool: ${toolCall.function.name}`,
            });
          }
        }
        // Loop again so the LLM can read the tool results and respond
        continue;
      }

      // No tool call — this is the final answer
      finalMessage = msg;
      break;
    }

    if (!finalMessage) {
      return NextResponse.json(
        {
          error:
            "Reached maximum tool-call iterations without a final answer.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reply: finalMessage.content,
      toolCalls: toolTrace,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Unknown server error" },
      { status: 500 }
    );
  }
}
