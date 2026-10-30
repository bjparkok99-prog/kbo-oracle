import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { FanProvider } from "@/components/FanProvider";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "KBO 오라클 | 2026 승부예측 & 분석",
  description: "KBO 팀·선수 기록, 상대전적, 데이터 기반 승부예측을 한 눈에. 팬 예측 게임까지.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <FanProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
          <Footer />
        </FanProvider>
      </body>
    </html>
  );
}
