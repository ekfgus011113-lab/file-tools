import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://filefit.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "파일핏 | 사진 용량 줄이기",
    template: "%s | 파일핏",
  },
  description:
    "사진을 100KB, 300KB, 500KB, 1MB 이하로 간편하게 줄이는 무료 온라인 도구입니다. 사진은 서버로 전송되지 않고 기기 안에서 처리됩니다.",
  applicationName: "파일핏",
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
    siteName: "파일핏",
    title: "파일핏 | 사진 용량 줄이기",
    description: "설치와 가입 없이 사진을 원하는 용량 이하로 줄이세요. 사진은 기기 안에서만 처리됩니다.",
    images: [
      {
        url: "/og.png",
        alt: "파일핏 - 사진 용량을 원하는 크기 이하로",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "파일핏 | 사진 용량 줄이기",
    description: "사진을 100KB, 300KB, 500KB, 1MB 이하로 간편하게 줄이는 무료 도구",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <meta
          name="naver-site-verification"
          content="4bc540da98549fd9a49d774b52a79308f360b87b"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
