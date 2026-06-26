import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JP AI Monitor — Japanese AI Tool Discoveries",
  description: "Weekly digest of the most interesting Japanese AI tools, workflows, and product launches. Sources: Zenn, Qiita, Note.com.",
  openGraph: {
    title: "JP AI Monitor",
    description: "Weekly Japanese AI tool discoveries — Zenn, Qiita, Note",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex flex-col min-h-screen">{children}</body>
    </html>
  );
}
