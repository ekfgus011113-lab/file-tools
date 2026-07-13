import type { Metadata } from "next";
import { ImageResizer } from "./ImageResizer";

const pageUrl = "https://filefit.kr/resize-image";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "파일핏 사진 크기 변경",
  url: pageUrl,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description: "사진의 가로와 세로 픽셀 크기를 브라우저에서 변경하는 무료 도구",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export const metadata: Metadata = {
  title: "사진 크기 변경 - 가로 세로 픽셀 조절",
  description:
    "사진 가로·세로 크기를 원하는 픽셀로 변경하세요. 비율 유지, JPG·PNG·WEBP 지원, 서버 업로드 없이 무료로 사용할 수 있습니다.",
  alternates: { canonical: "/resize-image" },
  openGraph: {
    title: "사진 크기 변경 - 가로 세로 픽셀 조절 | 파일핏",
    description: "사진 비율을 유지하면서 원하는 가로·세로 픽셀로 변경하세요.",
    url: pageUrl,
  },
};

export default function ResizeImagePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <ImageResizer />
    </>
  );
}
