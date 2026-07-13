import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://fileddak.ekfgus011113.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "파일딱 | 사진 용량 줄이기",
    template: "%s | 파일딱",
  },
  description:
    "사진을 100KB, 300KB, 500KB, 1MB 이하로 간편하게 줄이는 무료 온라인 도구입니다. 사진은 서버로 전송되지 않고 기기 안에서 처리됩니다.",
  applicationName: "파일딱",
  keywords: [
    "사진 용량 줄이기",
    "이미지 압축",
    "사진 500KB 이하",
    "사진 300KB 이하",
    "JPG 압축",
    "PNG 압축",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "파일딱",
    title: "파일딱 | 사진 용량 줄이기",
    description: "설치와 가입 없이 사진을 원하는 용량 이하로 줄이세요. 사진은 기기 안에서만 처리됩니다.",
  },
  twitter: {
    card: "summary",
    title: "파일딱 | 사진 용량 줄이기",
    description: "사진을 100KB, 300KB, 500KB, 1MB 이하로 간편하게 줄이는 무료 도구",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
