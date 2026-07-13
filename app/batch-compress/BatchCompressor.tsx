"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ToolNav } from "../ToolNav";

const PRESETS = [100, 300, 500, 1024];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 10;

type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  reached: boolean;
  filename: string;
  url: string;
};

type BatchItem = {
  id: string;
  file: File;
  status: "waiting" | "working" | "done" | "error";
  result?: CompressedImage;
  error?: string;
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

function compressedFilename(originalName: string, type: string) {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-compressed.${extensionFor(type)}`;
}

async function loadImage(file: File) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap as CanvasImageSource, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await image.decode();
    return { source: image as CanvasImageSource, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("압축 결과를 만들 수 없습니다."))), type, quality);
  });
}

function hasTransparentPixels(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(96, width);
  canvas.height = Math.min(96, height);
  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!context) return true;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < pixels.length; index += 4) if (pixels[index] < 255) return true;
  return false;
}

async function compressImage(file: File, targetBytes: number) {
  const decoded = await loadImage(file);
  if (file.size <= targetBytes) {
    const result = { blob: file as Blob, width: decoded.width, height: decoded.height, reached: true };
    decoded.close();
    return result;
  }

  const pngHasTransparency = file.type === "image/png" && hasTransparentPixels(decoded.source, decoded.width, decoded.height);
  const outputType = file.type === "image/png" && !pngHasTransparency ? "image/jpeg" : file.type;
  let width = decoded.width;
  let height = decoded.height;
  let smallest: { blob: Blob; width: number; height: number; reached: boolean } | null = null;

  const encode = async (nextWidth: number, nextHeight: number, quality?: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    const context = canvas.getContext("2d", { alpha: outputType === "image/png" });
    if (!context) throw new Error("이 브라우저에서는 이미지 처리를 시작할 수 없습니다.");
    if (outputType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, nextWidth, nextHeight);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, nextWidth, nextHeight);
    return canvasToBlob(canvas, outputType, quality);
  };

  try {
    for (let resizePass = 0; resizePass < 12; resizePass += 1) {
      if (outputType === "image/png") {
        const blob = await encode(width, height);
        const candidate = { blob, width, height, reached: blob.size <= targetBytes };
        if (!smallest || blob.size < smallest.blob.size) smallest = candidate;
        if (candidate.reached) return candidate;
      } else {
        let low = 0.28;
        let high = 0.95;
        let fitting: typeof smallest = null;
        let smallestAtSize: typeof smallest = null;
        for (let qualityPass = 0; qualityPass < 9; qualityPass += 1) {
          const quality = (low + high) / 2;
          const blob = await encode(width, height, quality);
          const candidate = { blob, width, height, reached: blob.size <= targetBytes };
          if (!smallestAtSize || blob.size < smallestAtSize.blob.size) smallestAtSize = candidate;
          if (candidate.reached) { fitting = candidate; low = quality; } else { high = quality; }
        }
        if (fitting) return fitting;
        if (smallestAtSize && (!smallest || smallestAtSize.blob.size < smallest.blob.size)) smallest = smallestAtSize;
      }

      const comparisonSize = smallest?.blob.size ?? file.size;
      const scale = Math.max(0.5, Math.min(0.86, Math.sqrt(targetBytes / comparisonSize) * 0.92));
      const nextWidth = Math.max(32, Math.floor(width * scale));
      const nextHeight = Math.max(32, Math.floor(height * scale));
      if (nextWidth === width && nextHeight === height) break;
      width = nextWidth;
      height = nextHeight;
    }
    if (!smallest) throw new Error("압축 결과를 만들 수 없습니다.");
    return smallest;
  } finally {
    decoded.close();
  }
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view: DataView, offset: number, value: number) { view.setUint16(offset, value, true); }
function write32(view: DataView, offset: number, value: number) { view.setUint32(offset, value, true); }

function joinBytes(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

async function createZip(files: { name: string; blob: Blob }[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50); write16(localView, 4, 20); write16(localView, 6, 0x0800);
    write16(localView, 8, 0); write16(localView, 10, dosTime); write16(localView, 12, dosDate);
    write32(localView, 14, crc); write32(localView, 18, data.length); write32(localView, 22, data.length);
    write16(localView, 26, name.length); write16(localView, 28, 0); local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    write32(centralView, 0, 0x02014b50); write16(centralView, 4, 20); write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800); write16(centralView, 10, 0); write16(centralView, 12, dosTime);
    write16(centralView, 14, dosDate); write32(centralView, 16, crc); write32(centralView, 20, data.length);
    write32(centralView, 24, data.length); write16(centralView, 28, name.length); write16(centralView, 30, 0);
    write16(centralView, 32, 0); write16(centralView, 34, 0); write16(centralView, 36, 0);
    write32(centralView, 38, 0); write32(centralView, 42, localOffset); central.set(name, 46);
    localParts.push(local, data); centralParts.push(central); localOffset += local.length + data.length;
  }

  const centralDirectory = joinBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50); write16(endView, 4, 0); write16(endView, 6, 0);
  write16(endView, 8, files.length); write16(endView, 10, files.length);
  write32(endView, 12, centralDirectory.length); write32(endView, 16, localOffset); write16(endView, 20, 0);
  const zipBytes = joinBytes([...localParts, centralDirectory, end]);
  const buffer = zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: "application/zip" });
}

export function BatchCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const itemsRef = useRef<BatchItem[]>([]);
  const zipUrlRef = useRef<string | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [targetKb, setTargetKb] = useState(500);
  const [customTarget, setCustomTarget] = useState("500");
  const [isCustom, setIsCustom] = useState(false);
  const [running, setRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { zipUrlRef.current = zipUrl; }, [zipUrl]);
  useEffect(() => () => {
    for (const item of itemsRef.current) if (item.result?.url) URL.revokeObjectURL(item.result.url);
    if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current);
  }, []);

  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const completed = items.filter((item) => item.status === "done").length;

  const clearResults = () => {
    for (const item of items) if (item.result?.url) URL.revokeObjectURL(item.result.url);
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setZipUrl(null);
    setItems((current) => current.map((item) => ({ ...item, status: "waiting", result: undefined, error: undefined })));
    setMessage("");
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const candidates = Array.from(files).filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_BYTES);
    const available = MAX_FILES - items.length;
    const accepted: BatchItem[] = [];
    let nextTotal = totalSize;
    for (const file of candidates.slice(0, available)) {
      if (nextTotal + file.size > MAX_TOTAL_BYTES) break;
      nextTotal += file.size;
      accepted.push({ id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, status: "waiting" });
    }
    if (!accepted.length) {
      setMessage(`JPG·PNG·WEBP 사진을 최대 ${MAX_FILES}장, 전체 100MB까지 선택할 수 있어요.`);
      return;
    }
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setZipUrl(null);
    setItems((current) => [...current, ...accepted]);
    setMessage(candidates.length > accepted.length ? "허용 범위 안의 사진만 추가했어요." : "");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (running || items.length >= MAX_FILES) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = running || items.length >= MAX_FILES ? "none" : "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (running || items.length >= MAX_FILES) return;
    addFiles(event.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (target?.result?.url) URL.revokeObjectURL(target.result.url);
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setZipUrl(null);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const chooseTarget = (value: number) => {
    setTargetKb(value); setCustomTarget(String(value)); setIsCustom(false); clearResults();
  };

  const handleCustomTarget = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setCustomTarget(digits); setIsCustom(true); if (digits) setTargetKb(Number(digits)); clearResults();
  };

  const runBatch = async () => {
    if (!items.length) { inputRef.current?.click(); return; }
    if (targetKb < 20 || targetKb > 10240) { setMessage("목표 용량은 20KB부터 10,240KB 사이로 입력해 주세요."); return; }
    setRunning(true); setMessage("사진을 한 장씩 안전하게 압축하고 있어요.");
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setZipUrl(null);
    const nextItems = items.map((item) => ({ ...item, status: "waiting" as const, result: undefined, error: undefined }));
    setItems(nextItems);

    for (let index = 0; index < nextItems.length; index += 1) {
      nextItems[index] = { ...nextItems[index], status: "working" };
      setItems([...nextItems]);
      try {
        const compressed = await compressImage(nextItems[index].file, targetKb * 1024);
        const filename = compressedFilename(nextItems[index].file.name, compressed.blob.type || nextItems[index].file.type);
        nextItems[index] = { ...nextItems[index], status: "done", result: { ...compressed, filename, url: URL.createObjectURL(compressed.blob) } };
      } catch (error) {
        nextItems[index] = { ...nextItems[index], status: "error", error: error instanceof Error ? error.message : "압축하지 못했어요." };
      }
      setItems([...nextItems]);
    }

    const successful = nextItems.filter((item) => item.result).map((item) => ({ name: item.result!.filename, blob: item.result!.blob }));
    if (successful.length) {
      const zip = await createZip(successful);
      setZipUrl(URL.createObjectURL(zip));
      setMessage(`${successful.length}장의 압축을 완료했어요.`);
    } else {
      setMessage("압축을 완료한 사진이 없습니다. 다른 사진으로 다시 시도해 주세요.");
    }
    setRunning(false);
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="파일핏 처음으로"><span className="brand-mark" aria-hidden="true">핏</span><span>파일핏</span></a>
        <ToolNav current="/batch-compress" />
      </header>

      <section className="hero resize-hero">
        <div className="eyebrow"><span aria-hidden="true">●</span> 최대 10장 한 번에</div>
        <h1>여러 사진을<br /><strong>한꺼번에 용량 줄이기</strong></h1>
        <p>같은 목표 용량을 적용하고 결과를 ZIP 파일 하나로 저장하세요. 사진은 서버로 전송되지 않습니다.</p>
      </section>

      <section className="tool-shell batch-shell" aria-labelledby="batch-tool-title">
        <div className="step-heading"><span>1</span><div><h2 id="batch-tool-title">사진 여러 장 선택</h2><p>최대 10장 · 장당 30MB · 전체 100MB</p></div></div>
        <div
          className={`drop-zone batch-drop ${items.length ? "has-file" : ""} ${isDragging ? "dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleInput} hidden />
          <button type="button" className="drop-button" onClick={() => inputRef.current?.click()} disabled={items.length >= MAX_FILES || running}>
            <span className="upload-icon" aria-hidden="true">＋</span><strong>{isDragging ? "여기에 사진을 놓으세요" : items.length ? "사진 더 추가하기" : "사진을 여러 장 선택하세요"}</strong><span>{isDragging ? "놓으면 목록에 바로 추가됩니다" : "누르거나 여기로 끌어다 놓기 · JPG, PNG, WEBP"}</span>
          </button>
        </div>

        {items.length > 0 && (
          <div className="batch-list" aria-label="선택한 사진 목록">
            <div className="batch-summary"><strong>{items.length}장</strong><span>전체 {formatBytes(totalSize)}</span></div>
            {items.map((item, index) => (
              <div className={`batch-item ${item.status}`} key={item.id}>
                <span className="batch-number">{index + 1}</span>
                <div><strong>{item.file.name}</strong><span>{formatBytes(item.file.size)}{item.result ? ` → ${formatBytes(item.result.blob.size)}` : ""}</span></div>
                {item.status === "working" && <span className="mini-spinner" aria-label="압축 중" />}
                {item.status === "done" && item.result && <a href={item.result.url} download={item.result.filename}>저장</a>}
                {item.status === "error" && <span className="batch-error" title={item.error}>실패</span>}
                {!running && item.status !== "done" && <button type="button" onClick={() => removeItem(item.id)} aria-label={`${item.file.name} 삭제`}>×</button>}
              </div>
            ))}
          </div>
        )}

        <div className="divider" />
        <div className="step-heading"><span>2</span><div><h2>사진당 목표 용량</h2><p>모든 사진에 같은 기준을 적용합니다.</p></div></div>
        <div className="target-grid" role="group" aria-label="사진당 목표 용량 선택">
          {PRESETS.map((preset) => <button type="button" key={preset} className={!isCustom && targetKb === preset ? "active" : ""} onClick={() => chooseTarget(preset)} aria-pressed={!isCustom && targetKb === preset}>{preset === 1024 ? "1MB" : `${preset}KB`}</button>)}
        </div>
        <label className={`custom-target ${isCustom ? "active" : ""}`}><span>직접 입력</span><span className="input-wrap"><input inputMode="numeric" value={customTarget} onChange={(event) => handleCustomTarget(event.target.value)} aria-label="사진당 목표 용량 직접 입력" /><b>KB</b></span></label>

        <button type="button" className="primary-button" onClick={runBatch} disabled={running}>{running ? <><span className="spinner" aria-hidden="true" /> {completed}/{items.length}장 압축 중</> : "여러 사진 압축하기"}</button>
        {message && <div className="status-message" role="status"><span aria-hidden="true">{zipUrl ? "✓" : "…"}</span>{message}</div>}
        {zipUrl && <section className="result-card batch-result"><div className="result-top"><div><span className="result-label">일괄 압축 완료</span><h2>{completed}장</h2></div></div><a className="download-button" href={zipUrl} download="filefit-compressed.zip">압축한 사진 모두 저장하기 <span aria-hidden="true">↓</span></a><p className="result-detail">ZIP 파일 하나로 저장됩니다.</p></section>}
      </section>

      <section className="role-switch-section single-switch" aria-labelledby="single-switch-title">
        <div><span>사진이 한 장뿐인가요?</span><h2 id="single-switch-title">목록과 ZIP 없이 더 간단하게 압축하세요.</h2><p>사진 한 장을 100KB, 300KB, 500KB 또는 원하는 용량 이하로 빠르게 줄입니다.</p></div>
        <a href="/">사진 한 장 빠른 압축 <span aria-hidden="true">→</span></a>
      </section>

      <section className="trust-section" aria-label="일괄 압축 특징">
        <article><span aria-hidden="true">＋</span><h3>최대 10장을 한 번에</h3><p>같은 기준으로 여러 사진을 차례대로 압축합니다.</p></article>
        <article><span aria-hidden="true">↓</span><h3>ZIP 파일로 한 번에 저장</h3><p>결과를 개별로 받거나 하나의 묶음으로 저장할 수 있어요.</p></article>
        <article><span aria-hidden="true">◇</span><h3>사진이 밖으로 나가지 않아요</h3><p>모든 작업은 현재 기기의 브라우저 안에서 처리합니다.</p></article>
      </section>
      <footer><strong>파일핏</strong><span>사진은 서버에 저장하거나 전송하지 않습니다.</span></footer>
    </main>
  );
}
