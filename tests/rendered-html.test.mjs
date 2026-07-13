import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/", accept = "text/html") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept } }),
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
  assert.match(html, /<title>사진 용량 줄이기 \| 파일핏<\/title>/i);
  assert.doesNotMatch(html, /파일핏 \| 파일핏/);
  assert.match(html, /사진 용량을/);
  assert.match(html, /목표 용량/);
  assert.match(html, /사진은 서버로 전송되지 않습니다/);
  assert.match(html, /type="file"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/filefit\.kr\/?"/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("publishes search engine discovery routes", async () => {
  const robotsResponse = await render("/robots.txt", "text/plain");
  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Sitemap: https:\/\/filefit\.kr\/sitemap\.xml/i);

  const sitemapResponse = await render("/sitemap.xml", "application/xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /<loc>https:\/\/filefit\.kr<\/loc>/i);
  assert.match(sitemap, /<loc>https:\/\/filefit\.kr\/guide\/photo-500kb<\/loc>/i);
});

test("publishes the 500KB photo guide", async () => {
  const response = await render("/guide/photo-500kb");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /휴대폰 사진을 500KB 이하로 줄이는 방법/);
  assert.match(html, /https:\/\/filefit\.kr\/guide\/photo-500kb/);
  assert.match(html, /"@type":"HowTo"/);
  assert.match(html, /파일핏에서 사진 용량 줄이기/);
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
