import type { Metadata } from "next";
import { ImageCompressor } from "./ImageCompressor";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "파일딱",
  url: "https://fileddak.ekfgus011113.chatgpt.site/",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript enabled",
  description: "사진을 원하는 파일 용량 이하로 줄이는 무료 온라인 이미지 압축 도구",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  featureList: [
    "JPG, PNG, WEBP 이미지 압축",
    "100KB, 300KB, 500KB, 1MB 목표 용량",
    "서버 업로드 없는 브라우저 내부 처리",
  ],
};

export const metadata: Metadata = {
  title: "사진 용량 줄이기",
  description:
    "사진을 100KB, 300KB, 500KB, 1MB 이하로 간편하게 줄이세요. 사진은 서버로 전송되지 않고 기기 안에서 처리됩니다.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <ImageCompressor />
    </>
  );
}
