import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "파일딱 | 사진 용량 줄이기",
    template: "%s | 파일딱",
  },
  description: "사진을 원하는 용량 이하로 간편하게 줄이는 무료 온라인 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
