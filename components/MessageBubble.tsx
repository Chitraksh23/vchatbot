"use client";

export interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  toolQueries?: string[];
}

export default function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`bubble-row ${isUser ? "user" : "bot"}`}>
      <div>
        {!isUser && message.toolQueries && message.toolQueries.length > 0 && (
          <div className="tool-note">
            🔎 Searched: {message.toolQueries.join(", ")}
          </div>
        )}
        <div className={`bubble ${isUser ? "user" : "bot"}`}>
          {message.content}
        </div>
      </div>
    </div>
  );
}
