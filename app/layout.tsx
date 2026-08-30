import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visa Advisor Chatbot",
  description:
    "AI chatbot that recommends countries based on your interests and walks you through the end-to-end visa process.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
