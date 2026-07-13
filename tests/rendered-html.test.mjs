import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the Korean image compression tool", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="ko"/i);
  assert.match(html, /사진 용량을/);
  assert.match(html, /목표 용량/);
  assert.match(html, /사진은 서버로 전송되지 않습니다/);
  assert.match(html, /type="file"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the MVP client-side and limits accepted formats", async () => {
  const source = await readFile(new URL("../app/ImageCompressor.tsx", import.meta.url), "utf8");
  assert.match(source, /createImageBitmap/);
  assert.match(source, /canvas\.toBlob/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/png/);
  assert.match(source, /image\/webp/);
  assert.match(source, /hasTransparentPixels/);
  assert.match(source, /file\.type === "image\/png" && !pngHasTransparency \? "image\/jpeg"/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|FormData/);
});
