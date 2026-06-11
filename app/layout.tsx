import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Riad Sacroud — AI Portfolio",
  description:
    "Chat with Riad Sacroud's AI agent — ask about his stack, projects, and availability, in English or French. Full-stack engineer, open to work.",
  authors: [{ name: "Riad Sacroud" }],
  keywords: [
    "Riad Sacroud",
    "full-stack engineer",
    "AI portfolio",
    "React",
    "Next.js",
    "TypeScript",
  ],
  openGraph: {
    title: "Riad Sacroud — AI Portfolio",
    description:
      "Ask Riad's AI agent anything about his work, stack, or availability — in English or French.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
