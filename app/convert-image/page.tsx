import type { Metadata } from "next";
import { ImageConverter } from "./ImageConverter";

const pageUrl = "https://filefit.kr/convert-image";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "파일핏 JPG PNG WEBP 변환",
  url: pageUrl,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description: "JPG, PNG, WEBP 사진을 브라우저에서 무료로 변환하는 온라인 도구",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export const metadata: Metadata = {
  title: "JPG PNG WEBP 변환 - 사진 형식 바꾸기",
  description:
    "JPG, PNG, WEBP 사진 형식을 설치 없이 무료로 변환하세요. 사진 크기를 유지하며 기기 안에서 안전하게 처리합니다.",
  alternates: { canonical: "/convert-image" },
  openGraph: {
    title: "JPG PNG WEBP 변환 - 사진 형식 바꾸기 | 파일핏",
    description: "사진 크기는 그대로 유지하고 JPG, PNG, WEBP 중 필요한 형식으로 바꾸세요.",
    url: pageUrl,
  },
};

export default function ConvertImagePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <ImageConverter />
    </>
  );
}
