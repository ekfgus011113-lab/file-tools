import type { Metadata } from "next";
import { ImageCompressor } from "./ImageCompressor";

export const metadata: Metadata = {
  title: "사진 용량 줄이기 | 파일딱",
  description:
    "사진을 100KB, 300KB, 500KB, 1MB 이하로 간편하게 줄이세요. 사진은 서버로 전송되지 않고 기기 안에서 처리됩니다.",
};

export default function Home() {
  return <ImageCompressor />;
}
