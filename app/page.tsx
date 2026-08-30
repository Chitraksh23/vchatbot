import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <main className="app">
      <div className="header">
        <h1>🌍 Visa Advisor</h1>
        <p>
          Tell me your interests (study, work, travel, budget, timeline) and
          I'll recommend a country and walk you through the visa process,
          with live web results where it matters.
        </p>
      </div>
      <ChatWindow />
    </main>
  );
}
