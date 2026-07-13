"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

const PRESETS = [100, 300, 500, 1024];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 30 * 1024 * 1024;

type CompressionResult = {
  blob: Blob;
  width: number;
  height: number;
  reached: boolean;
  unchanged: boolean;
};

type ReadyResult = CompressionResult & {
  url: string;
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

function makeFilename(originalName: string, type: string) {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-compressed.${extensionFor(type)}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지를 변환할 수 없습니다."))),
      type,
      quality,
    );
  });
}

async function loadImage(file: File) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      source: image as CanvasImageSource,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  }
}

function hasTransparentPixels(source: CanvasImageSource, width: number, height: number) {
  const sampleWidth = Math.min(96, width);
  const sampleHeight = Math.min(96, height);
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!context) return true;
  context.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) return true;
  }
  return false;
}

async function compressImage(file: File, targetBytes: number): Promise<CompressionResult> {
  if (file.size <= targetBytes) {
    const decoded = await loadImage(file);
    const result = {
      blob: file,
      width: decoded.width,
      height: decoded.height,
      reached: true,
      unchanged: true,
    };
    decoded.close();
    return result;
  }

  const decoded = await loadImage(file);
  const pngHasTransparency =
    file.type === "image/png" && hasTransparentPixels(decoded.source, decoded.width, decoded.height);
  const outputType = file.type === "image/png" && !pngHasTransparency ? "image/jpeg" : file.type;
  let width = decoded.width;
  let height = decoded.height;
  let smallest: CompressionResult | null = null;

  const encode = async (encodeWidth: number, encodeHeight: number, quality?: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = encodeWidth;
    canvas.height = encodeHeight;
    const context = canvas.getContext("2d", { alpha: outputType === "image/png" });
    if (!context) throw new Error("이 브라우저에서는 이미지 처리를 시작할 수 없습니다.");
    if (outputType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, encodeWidth, encodeHeight);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, encodeWidth, encodeHeight);
    return canvasToBlob(canvas, outputType, quality);
  };

  try {
    for (let resizePass = 0; resizePass < 12; resizePass += 1) {
      if (outputType === "image/png") {
        const blob = await encode(width, height);
        const candidate = { blob, width, height, reached: blob.size <= targetBytes, unchanged: false };
        if (!smallest || blob.size < smallest.blob.size) smallest = candidate;
        if (candidate.reached) return candidate;

        const ratio = Math.sqrt(targetBytes / blob.size) * 0.94;
        const scale = Math.max(0.48, Math.min(0.88, ratio));
        const nextWidth = Math.max(32, Math.floor(width * scale));
        const nextHeight = Math.max(32, Math.floor(height * scale));
        if (nextWidth === width && nextHeight === height) break;
        width = nextWidth;
        height = nextHeight;
        continue;
      }

      let low = 0.28;
      let high = 0.95;
      let fitting: CompressionResult | null = null;
      let smallestAtSize: CompressionResult | null = null;

      for (let qualityPass = 0; qualityPass < 9; qualityPass += 1) {
        const quality = (low + high) / 2;
        const blob = await encode(width, height, quality);
        const candidate = { blob, width, height, reached: blob.size <= targetBytes, unchanged: false };
        if (!smallestAtSize || blob.size < smallestAtSize.blob.size) smallestAtSize = candidate;

        if (blob.size <= targetBytes) {
          fitting = candidate;
          low = quality;
        } else {
          high = quality;
        }
      }

      if (fitting) return fitting;
      if (smallestAtSize && (!smallest || smallestAtSize.blob.size < smallest.blob.size)) {
        smallest = smallestAtSize;
      }

      const comparisonSize = smallestAtSize?.blob.size ?? file.size;
      const ratio = Math.sqrt(targetBytes / comparisonSize) * 0.92;
      const scale = Math.max(0.52, Math.min(0.86, ratio));
      const nextWidth = Math.max(32, Math.floor(width * scale));
      const nextHeight = Math.max(32, Math.floor(height * scale));
      if (nextWidth === width && nextHeight === height) break;
      width = nextWidth;
      height = nextHeight;
    }

    if (!smallest) throw new Error("압축 결과를 만들 수 없습니다.");
    return { ...smallest, reached: smallest.blob.size <= targetBytes };
  } finally {
    decoded.close();
  }
}

export function ImageCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [targetKb, setTargetKb] = useState(500);
  const [customTarget, setCustomTarget] = useState("500");
  const [isCustom, setIsCustom] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ReadyResult | null>(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  useEffect(() => {
    const resultUrl = result?.url;
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [result?.url]);

  const reduction = useMemo(() => {
    if (!file || !result) return 0;
    return Math.max(0, Math.round((1 - result.blob.size / file.size) * 100));
  }, [file, result]);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setStatus("error");
      setMessage("JPG, PNG, WEBP 사진만 선택할 수 있어요.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setStatus("error");
      setMessage("현재 버전에서는 30MB 이하 사진을 선택해 주세요.");
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(selected);
    setOriginalUrl(URL.createObjectURL(selected));
    setResult(null);
    setStatus("idle");
    setMessage("");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const choosePreset = (value: number) => {
    setTargetKb(value);
    setCustomTarget(String(value));
    setIsCustom(false);
    setResult(null);
    setStatus("idle");
  };

  const handleCustomTarget = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setCustomTarget(digits);
    setIsCustom(true);
    if (digits) setTargetKb(Number(digits));
    setResult(null);
    setStatus("idle");
  };

  const runCompression = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    if (!targetKb || targetKb < 20 || targetKb > 10240) {
      setStatus("error");
      setMessage("목표 용량은 20KB부터 10,240KB 사이로 입력해 주세요.");
      return;
    }

    setStatus("working");
    setMessage("사진에 맞는 화질과 크기를 찾고 있어요.");
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const compressed = await compressImage(file, targetKb * 1024);
      const url = URL.createObjectURL(compressed.blob);
      setResult({ ...compressed, url, filename: makeFilename(file.name, compressed.blob.type || file.type) });
      setStatus("done");
      if (compressed.unchanged) {
        setMessage("이미 목표 용량보다 작아서 원본 품질을 그대로 유지했어요.");
      } else if (compressed.reached) {
        setMessage(
          file.type !== compressed.blob.type
            ? "글자 선명도를 더 유지하도록 PNG를 JPG로 바꿔 목표 용량 이하로 압축했어요."
            : "목표 용량 이하로 압축했어요.",
        );
      } else {
        setMessage("가능한 가장 작은 결과를 만들었지만 목표 용량에는 도달하지 못했어요.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "압축 중 문제가 발생했습니다. 다른 사진으로 다시 시도해 주세요.");
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="파일딱 처음으로">
          <span className="brand-mark" aria-hidden="true">딱</span>
          <span>파일딱</span>
        </a>
        <span className="header-note">설치 없이, 기기 안에서 안전하게</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span aria-hidden="true">●</span> 브라우저에서 바로 처리</div>
        <h1>사진 용량을<br /><strong>원하는 크기 이하로</strong></h1>
        <p>100KB, 300KB, 500KB, 1MB 중 선택하거나 직접 입력하세요. 사진은 서버로 전송되지 않습니다.</p>
      </section>

      <section className="tool-shell" aria-labelledby="tool-title">
        <div className="step-heading">
          <span>1</span>
          <div><h2 id="tool-title">사진 선택</h2><p>JPG, PNG, WEBP · 최대 30MB</p></div>
        </div>

        <div
          className={`drop-zone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInput} hidden />
          {file && originalUrl ? (
            <div className="selected-file">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalUrl} alt="선택한 원본 사진 미리보기" />
              <div className="file-copy"><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
              <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>다른 사진</button>
            </div>
          ) : (
            <button type="button" className="drop-button" onClick={() => inputRef.current?.click()}>
              <span className="upload-icon" aria-hidden="true">↑</span>
              <strong>사진을 선택하세요</strong>
              <span>누르거나 여기로 끌어다 놓기</span>
            </button>
          )}
        </div>

        <div className="divider" />

        <div className="step-heading">
          <span>2</span>
          <div><h2>목표 용량</h2><p>선택한 크기 이하로 자동 조절합니다.</p></div>
        </div>

        <div className="target-grid" role="group" aria-label="목표 파일 용량 선택">
          {PRESETS.map((preset) => (
            <button
              type="button"
              key={preset}
              className={!isCustom && targetKb === preset ? "active" : ""}
              onClick={() => choosePreset(preset)}
              aria-pressed={!isCustom && targetKb === preset}
            >
              {preset === 1024 ? "1MB" : `${preset}KB`}
            </button>
          ))}
        </div>

        <label className={`custom-target ${isCustom ? "active" : ""}`}>
          <span>직접 입력</span>
          <span className="input-wrap"><input inputMode="numeric" value={customTarget} onChange={(event) => handleCustomTarget(event.target.value)} aria-label="목표 용량 직접 입력" /><b>KB</b></span>
        </label>

        <button type="button" className="primary-button" onClick={runCompression} disabled={status === "working"}>
          {status === "working" ? <><span className="spinner" aria-hidden="true" /> 압축하는 중</> : "사진 용량 줄이기"}
        </button>

        {message && (
          <div className={`status-message ${status}`} role={status === "error" ? "alert" : "status"}>
            <span aria-hidden="true">{status === "error" ? "!" : status === "done" ? "✓" : "…"}</span>
            {message}
          </div>
        )}

        {file && result && (
          <section className="result-card" aria-labelledby="result-title">
            <div className="result-top">
              <div><span className="result-label">압축 완료</span><h2 id="result-title">{formatBytes(result.blob.size)}</h2></div>
              {!result.unchanged && <strong className="saving">{reduction}% 감소</strong>}
            </div>
            <div className="size-comparison">
              <div><span>압축 전</span><strong>{formatBytes(file.size)}</strong></div>
              <span className="arrow" aria-hidden="true">→</span>
              <div><span>압축 후</span><strong>{formatBytes(result.blob.size)}</strong></div>
            </div>
            <a className="download-button" href={result.url} download={result.filename}>압축된 사진 저장하기 <span aria-hidden="true">↓</span></a>
            {file.type !== result.blob.type && (
              <p className="format-change"><strong>PNG → JPG</strong> 해상도를 더 많이 유지하기 위해 형식을 변경했어요.</p>
            )}
            <p className="result-detail">결과 크기 {result.width.toLocaleString()} × {result.height.toLocaleString()}px · {extensionFor(result.blob.type || file.type).toUpperCase()}</p>
          </section>
        )}
      </section>

      <section className="trust-section" aria-label="서비스 특징">
        <article><span aria-hidden="true">⌁</span><h3>사진이 밖으로 나가지 않아요</h3><p>업로드 없이 현재 기기의 브라우저에서 처리합니다.</p></article>
        <article><span aria-hidden="true">◎</span><h3>목표 용량을 자동으로 맞춰요</h3><p>화질과 해상도를 함께 조절해 알맞은 결과를 찾습니다.</p></article>
        <article><span aria-hidden="true">◇</span><h3>설치와 가입이 필요 없어요</h3><p>휴대폰과 컴퓨터에서 바로 사용할 수 있습니다.</p></article>
      </section>

      <section className="guide-section">
        <div><span className="eyebrow">알아두세요</span><h2>용량을 줄이면 무엇이 달라지나요?</h2></div>
        <ul>
          <li><strong>화질</strong><span>목표 용량이 작을수록 사진의 세부 표현이 줄어들 수 있어요.</span></li>
          <li><strong>크기</strong><span>필요한 경우 가로·세로 해상도를 함께 줄여 목표에 맞춰요.</span></li>
          <li><strong>PNG</strong><span>투명 배경은 PNG로 유지하고, 일반 스크린샷은 선명도를 위해 JPG로 바꿀 수 있어요.</span></li>
        </ul>
      </section>

      <footer><strong>파일딱</strong><span>사진은 서버에 저장하거나 전송하지 않습니다.</span></footer>
    </main>
  );
}
