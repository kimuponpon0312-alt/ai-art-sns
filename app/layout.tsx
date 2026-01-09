import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-ART - 絵描きをAIから守るSNS",
  description: "アーティストの作品を保護し、AIによる無断使用から守るSNSプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
