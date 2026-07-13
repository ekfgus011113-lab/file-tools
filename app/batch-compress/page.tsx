import type { Metadata } from "next";
import { BatchCompressor } from "./BatchCompressor";

const pageUrl = "https://filefit.kr/batch-compress";
const structuredData = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "파일핏 여러 사진 일괄 압축", url: pageUrl,
  applicationCategory: "UtilitiesApplication", operatingSystem: "Any",
  description: "여러 장의 JPG, PNG, WEBP 사진을 한 번에 원하는 용량 이하로 압축하는 무료 도구",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export const metadata: Metadata = {
  title: "여러 사진 용량 한꺼번에 줄이기 - 일괄 압축",
  description: "사진 여러 장을 한 번에 원하는 용량 이하로 압축하고 ZIP으로 저장하세요. 최대 10장, JPG·PNG·WEBP를 기기 안에서 처리합니다.",
  alternates: { canonical: "/batch-compress" },
  openGraph: { title: "여러 사진 용량 한꺼번에 줄이기 | 파일핏", description: "최대 10장의 사진을 같은 목표 용량으로 압축하고 ZIP으로 저장하세요.", url: pageUrl },
};

export default function BatchCompressPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><BatchCompressor /></>;
}
