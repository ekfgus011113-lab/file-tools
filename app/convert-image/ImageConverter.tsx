"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 30 * 1024 * 1024;

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

type ImageInfo = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

type ConvertResult = {
  url: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
};

const FORMATS: { type: OutputFormat; label: string; note: string }[] = [
  { type: "image/jpeg", label: "JPG", note: "사진·호환성" },
  { type: "image/png", label: "PNG", note: "투명 배경" },
  { type: "image/webp", label: "WEBP", note: "작은 용량" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function extensionFor(type: OutputFormat) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function formatLabel(type: string) {
  if (type === "image/png") return "PNG";
  if (type === "image/webp") return "WEBP";
  return "JPG";
}

function convertedFilename(originalName: string, type: OutputFormat) {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-converted.${extensionFor(type)}`;
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

function canvasToBlob(canvas: HTMLCanvasElement, type: OutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("변환된 사진을 만들 수 없습니다."))),
      type,
      type === "image/png" ? undefined : quality,
    );
  });
}

export function ImageConverter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [outputType, setOutputType] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(92);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ConvertResult | null>(null);

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
      setWidth(decoded.width);
      setHeight(decoded.height);
      setOutputType(selected.type === "image/jpeg" ? "image/webp" : "image/jpeg");
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

  const chooseFormat = (type: OutputFormat) => {
    setOutputType(type);
    resetResult();
  };

  const runConversion = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    setStatus("working");
    setMessage("새로운 형식으로 사진을 만들고 있어요.");
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const decoded = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = decoded.width;
      canvas.height = decoded.height;
      const context = canvas.getContext("2d", { alpha: outputType !== "image/jpeg" });
      if (!context) throw new Error("이 브라우저에서는 이미지 처리를 시작할 수 없습니다.");
      if (outputType === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, decoded.width, decoded.height);
      }
      context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);
      const blob = await canvasToBlob(canvas, outputType, quality / 100);
      decoded.close();
      const url = URL.createObjectURL(blob);
      setResult({
        url,
        blob,
        filename: convertedFilename(file.name, outputType),
        width: decoded.width,
        height: decoded.height,
      });
      setStatus("done");
      setMessage(
        outputType === "image/jpeg" && file.type === "image/png"
          ? "JPG는 투명 배경을 지원하지 않아 투명한 부분을 흰색으로 바꿨어요."
          : `${formatLabel(outputType)} 형식으로 변환했어요.`,
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "형식 변환 중 문제가 발생했습니다.");
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="파일핏 처음으로">
          <span className="brand-mark" aria-hidden="true">핏</span>
          <span>파일핏</span>
        </a>
        <a className="header-tool-link" href="/resize-image">사진 크기 변경</a>
      </header>

      <section className="hero resize-hero">
        <div className="eyebrow"><span aria-hidden="true">●</span> 설치 없이 바로 변환</div>
        <h1>JPG·PNG·WEBP<br /><strong>사진 형식 변환</strong></h1>
        <p>사진 크기는 그대로 유지하고 필요한 파일 형식으로 바꾸세요. 사진은 서버로 전송되지 않습니다.</p>
      </section>

      <section className="tool-shell" aria-labelledby="convert-tool-title">
        <div className="step-heading">
          <span>1</span>
          <div><h2 id="convert-tool-title">사진 선택</h2><p>JPG, PNG, WEBP · 최대 30MB</p></div>
        </div>

        <div className={`drop-zone ${file ? "has-file" : ""}`}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInput} hidden />
          {file && previewUrl ? (
            <div className="selected-file">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="선택한 원본 사진 미리보기" />
              <div className="file-copy">
                <strong>{file.name}</strong>
                <span>{formatLabel(file.type)} · {width.toLocaleString()} × {height.toLocaleString()}px · {formatBytes(file.size)}</span>
              </div>
              <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>다른 사진</button>
            </div>
          ) : (
            <button type="button" className="drop-button" onClick={() => inputRef.current?.click()}>
              <span className="upload-icon" aria-hidden="true">⇄</span>
              <strong>형식을 바꿀 사진을 선택하세요</strong>
              <span>휴대폰과 컴퓨터에서 바로 선택</span>
            </button>
          )}
        </div>

        <div className="divider" />

        <div className="step-heading">
          <span>2</span>
          <div><h2>변환할 형식</h2><p>사용 목적에 맞는 형식을 선택하세요.</p></div>
        </div>

        <div className="format-grid" role="group" aria-label="변환할 이미지 형식 선택">
          {FORMATS.map((format) => (
            <button
              type="button"
              key={format.type}
              className={outputType === format.type ? "active" : ""}
              onClick={() => chooseFormat(format.type)}
              aria-pressed={outputType === format.type}
            >
              <strong>{format.label}</strong><span>{format.note}</span>
            </button>
          ))}
        </div>

        {outputType !== "image/png" && (
          <label className="quality-control">
            <span><strong>결과 화질</strong><b>{quality}%</b></span>
            <input type="range" min="50" max="100" step="1" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); resetResult(); }} />
            <small>높을수록 선명하지만 파일 용량이 커질 수 있어요.</small>
          </label>
        )}

        <button type="button" className="primary-button" onClick={runConversion} disabled={status === "working"}>
          {status === "working" ? <><span className="spinner" aria-hidden="true" /> 변환하는 중</> : `${formatLabel(outputType)}로 변환하기`}
        </button>

        {message && (
          <div className={`status-message ${status}`} role={status === "error" ? "alert" : "status"}>
            <span aria-hidden="true">{status === "error" ? "!" : status === "done" ? "✓" : "…"}</span>{message}
          </div>
        )}

        {file && result && (
          <section className="result-card" aria-labelledby="convert-result-title">
            <div className="result-top">
              <div><span className="result-label">형식 변환 완료</span><h2 id="convert-result-title">{formatLabel(outputType)}</h2></div>
            </div>
            <div className="size-comparison">
              <div><span>변환 전</span><strong>{formatLabel(file.type)} · {formatBytes(file.size)}</strong></div>
              <span className="arrow" aria-hidden="true">→</span>
              <div><span>변환 후</span><strong>{formatLabel(outputType)} · {formatBytes(result.blob.size)}</strong></div>
            </div>
            <a className="download-button" href={result.url} download={result.filename}>변환한 사진 저장하기 <span aria-hidden="true">↓</span></a>
            <p className="result-detail">사진 크기 {result.width.toLocaleString()} × {result.height.toLocaleString()}px 유지</p>
          </section>
        )}
      </section>

      <section className="trust-section" aria-label="형식 변환 특징">
        <article><span aria-hidden="true">⇄</span><h3>세 가지 형식을 자유롭게</h3><p>JPG, PNG, WEBP 사이에서 원하는 형식으로 바꿀 수 있어요.</p></article>
        <article><span aria-hidden="true">◎</span><h3>사진 크기는 그대로</h3><p>가로·세로 픽셀은 바꾸지 않고 파일 형식만 변환합니다.</p></article>
        <article><span aria-hidden="true">◇</span><h3>사진이 밖으로 나가지 않아요</h3><p>업로드 없이 현재 기기의 브라우저에서 처리합니다.</p></article>
      </section>

      <footer><strong>파일핏</strong><span>사진은 서버에 저장하거나 전송하지 않습니다.</span></footer>
    </main>
  );
}
