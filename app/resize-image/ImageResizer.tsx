"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ToolNav } from "../ToolNav";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_DIMENSION = 12000;

type ImageInfo = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

type ResizeResult = {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  filename: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function resizedFilename(originalName: string, type: string) {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-resized.${extensionFor(type)}`;
}

async function loadImage(file: File): Promise<ImageInfo> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("크기를 변경한 사진을 만들 수 없습니다."))),
      type,
      type === "image/png" ? undefined : 0.92,
    );
  });
}

export function ImageResizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [locked, setLocked] = useState(true);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ResizeResult | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result?.url]);

  const resetResult = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setStatus("idle");
    setMessage("");
  };

  const selectFile = async (selected?: File) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setStatus("error");
      setMessage("JPG, PNG, WEBP 사진만 선택할 수 있어요.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setStatus("error");
      setMessage("30MB 이하 사진을 선택해 주세요.");
      return;
    }

    try {
      const decoded = await loadImage(selected);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setOriginalWidth(decoded.width);
      setOriginalHeight(decoded.height);
      setWidth(decoded.width);
      setHeight(decoded.height);
      setResult(null);
      setStatus("idle");
      setMessage("");
      decoded.close();
    } catch {
      setStatus("error");
      setMessage("사진을 읽을 수 없습니다. 다른 사진으로 다시 시도해 주세요.");
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const changeWidth = (value: string) => {
    const next = Math.min(MAX_DIMENSION, Number(value.replace(/\D/g, "")) || 0);
    setWidth(next);
    if (locked && originalWidth && originalHeight && next) {
      setHeight(Math.max(1, Math.round((next * originalHeight) / originalWidth)));
    }
    resetResult();
  };

  const changeHeight = (value: string) => {
    const next = Math.min(MAX_DIMENSION, Number(value.replace(/\D/g, "")) || 0);
    setHeight(next);
    if (locked && originalWidth && originalHeight && next) {
      setWidth(Math.max(1, Math.round((next * originalWidth) / originalHeight)));
    }
    resetResult();
  };

  const applyWidthPreset = (preset: number) => {
    if (!originalWidth || !originalHeight) return;
    const nextWidth = Math.min(preset, originalWidth);
    setWidth(nextWidth);
    setHeight(Math.max(1, Math.round((nextWidth * originalHeight) / originalWidth)));
    setLocked(true);
    resetResult();
  };

  const runResize = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
      setStatus("error");
      setMessage("가로와 세로는 1px부터 12,000px 사이로 입력해 주세요.");
      return;
    }

    setStatus("working");
    setMessage("새로운 크기로 사진을 만들고 있어요.");
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const decoded = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: file.type === "image/png" });
      if (!context) throw new Error("이 브라우저에서는 이미지 처리를 시작할 수 없습니다.");
      if (file.type === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(decoded.source, 0, 0, width, height);
      const blob = await canvasToBlob(canvas, file.type);
      decoded.close();
      const url = URL.createObjectURL(blob);
      setResult({ url, blob, width, height, filename: resizedFilename(file.name, blob.type || file.type) });
      setStatus("done");
      setMessage("사진 크기를 변경했어요. 결과를 확인하고 저장하세요.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "크기 변경 중 문제가 발생했습니다.");
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="파일핏 처음으로">
          <span className="brand-mark" aria-hidden="true">핏</span>
          <span>파일핏</span>
        </a>
        <ToolNav current="/resize-image" />
      </header>

      <section className="hero resize-hero">
        <div className="eyebrow"><span aria-hidden="true">●</span> 비율을 유지해 선명하게</div>
        <h1>사진 가로·세로<br /><strong>원하는 픽셀로 변경</strong></h1>
        <p>사진 비율을 유지하거나 가로·세로를 직접 입력하세요. 사진은 서버로 전송되지 않습니다.</p>
      </section>

      <section className="tool-shell" aria-labelledby="resize-tool-title">
        <div className="step-heading">
          <span>1</span>
          <div><h2 id="resize-tool-title">사진 선택</h2><p>JPG, PNG, WEBP · 최대 30MB</p></div>
        </div>

        <div className={`drop-zone ${file ? "has-file" : ""}`}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInput} hidden />
          {file && previewUrl ? (
            <div className="selected-file">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="선택한 원본 사진 미리보기" />
              <div className="file-copy">
                <strong>{file.name}</strong>
                <span>{originalWidth.toLocaleString()} × {originalHeight.toLocaleString()}px · {formatBytes(file.size)}</span>
              </div>
              <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>다른 사진</button>
            </div>
          ) : (
            <button type="button" className="drop-button" onClick={() => inputRef.current?.click()}>
              <span className="upload-icon" aria-hidden="true">↔</span>
              <strong>크기를 바꿀 사진을 선택하세요</strong>
              <span>휴대폰과 컴퓨터에서 바로 선택</span>
            </button>
          )}
        </div>

        <div className="divider" />

        <div className="step-heading">
          <span>2</span>
          <div><h2>새로운 사진 크기</h2><p>비율 잠금을 켜면 찌그러지지 않게 자동 계산합니다.</p></div>
        </div>

        <div className="dimension-grid">
          <label><span>가로</span><div><input inputMode="numeric" value={width || ""} onChange={(event) => changeWidth(event.target.value)} aria-label="새 가로 크기" /><b>px</b></div></label>
          <button type="button" className={`ratio-lock ${locked ? "active" : ""}`} onClick={() => setLocked((value) => !value)} aria-pressed={locked}>
            <span aria-hidden="true">{locked ? "↔" : "×"}</span>{locked ? "비율 유지" : "비율 해제"}
          </button>
          <label><span>세로</span><div><input inputMode="numeric" value={height || ""} onChange={(event) => changeHeight(event.target.value)} aria-label="새 세로 크기" /><b>px</b></div></label>
        </div>

        <div className="width-presets" role="group" aria-label="자주 쓰는 가로 크기">
          {[1920, 1280, 1080, 800].map((preset) => (
            <button type="button" key={preset} onClick={() => applyWidthPreset(preset)} disabled={!file}>{preset}px</button>
          ))}
        </div>

        <button type="button" className="primary-button" onClick={runResize} disabled={status === "working"}>
          {status === "working" ? <><span className="spinner" aria-hidden="true" /> 변경하는 중</> : "사진 크기 변경하기"}
        </button>

        {message && (
          <div className={`status-message ${status}`} role={status === "error" ? "alert" : "status"}>
            <span aria-hidden="true">{status === "error" ? "!" : status === "done" ? "✓" : "…"}</span>{message}
          </div>
        )}

        {file && result && (
          <section className="result-card" aria-labelledby="resize-result-title">
            <div className="result-top">
              <div><span className="result-label">크기 변경 완료</span><h2 id="resize-result-title">{result.width.toLocaleString()} × {result.height.toLocaleString()}px</h2></div>
            </div>
            <div className="size-comparison dimension-comparison">
              <div><span>변경 전</span><strong>{originalWidth.toLocaleString()} × {originalHeight.toLocaleString()}</strong></div>
              <span className="arrow" aria-hidden="true">→</span>
              <div><span>변경 후</span><strong>{result.width.toLocaleString()} × {result.height.toLocaleString()}</strong></div>
            </div>
            <a className="download-button" href={result.url} download={result.filename}>크기 변경한 사진 저장하기 <span aria-hidden="true">↓</span></a>
            <p className="result-detail">파일 용량 {formatBytes(result.blob.size)} · {extensionFor(result.blob.type || file.type).toUpperCase()}</p>
          </section>
        )}
      </section>

      <section className="trust-section" aria-label="크기 변경 특징">
        <article><span aria-hidden="true">↔</span><h3>원본 비율을 유지해요</h3><p>가로나 세로 하나만 바꾸면 다른 값도 자동 계산합니다.</p></article>
        <article><span aria-hidden="true">◎</span><h3>선명하게 다시 그려요</h3><p>브라우저의 고품질 보간을 사용해 새로운 크기로 만듭니다.</p></article>
        <article><span aria-hidden="true">◇</span><h3>사진이 밖으로 나가지 않아요</h3><p>업로드 없이 현재 기기의 브라우저에서 처리합니다.</p></article>
      </section>

      <section className="article-link-section" aria-labelledby="resize-guide-title">
        <div>
          <span className="section-kicker">사진 크기 가이드</span>
          <h2 id="resize-guide-title">픽셀 크기와 파일 용량은 무엇이 다를까요?</h2>
          <p>사진이 찌그러지지 않게 줄이는 방법과 용도별 가로 크기 예시를 확인하세요.</p>
        </div>
        <a href="/guide/resize-photo-pixels">사진 크기 변경 방법 보기 <span aria-hidden="true">→</span></a>
      </section>

      <footer><strong>파일핏</strong><span>사진은 서버에 저장하거나 전송하지 않습니다.</span></footer>
    </main>
  );
}
