"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble, { DisplayMessage } from "./MessageBubble";

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "I want to study a master's in AI, budget-friendly, English-taught",
  "I'm looking for a work visa in Europe as a software engineer",
  "Best country for a digital nomad / remote work visa",
  "Family migration options to Canada or Australia",
];

export default function ChatWindow() {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Visa Advisor. Tell me a bit about what you're looking for — e.g. purpose (study/work/travel/migration), your field, budget, and target timeline — and I'll recommend a country and walk you through the full visa process.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const newUserMessage: DisplayMessage = { role: "user", content: text };
    const nextMessages = [...messages, newUserMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages: ApiMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "(no response)",
          toolQueries: (data.toolCalls || []).map((t: { query: string }) => t.query),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${(err as Error).message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showChips = messages.length === 1;

  return (
    <>
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading && (
          <div className="bubble-row bot">
            <div className="bubble bot typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      {showChips && (
        <div className="suggestions">
          {STARTER_CHIPS.map((chip) => (
            <button
              key={chip}
              className="chip"
              onClick={() => sendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="input-bar">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you're looking for, or ask about a specific country's visa process..."
          rows={1}
        />
        <button onClick={() => sendMessage(input)} disabled={loading}>
          Send
        </button>
      </div>
    </>
  );
}
