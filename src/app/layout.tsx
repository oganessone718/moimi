import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 작업명 "모이미"(미확정). 사용자 노출 텍스트는 추후 변경 가능.
  title: "모이미 — 약속, 가입 없이 한 번에",
  description: "언제 어디서 볼지 한 번에. 가입 없이 링크로 공유하고 투표로 정해요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
