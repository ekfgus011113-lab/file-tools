import { appendFile } from "node:fs/promises";

const baseUrl = process.env.SITE_URL ?? "https://filefit.kr";
const checks = [
  { path: "/", type: "text/html", contains: ["사진 용량", "canonical"] },
  { path: "/resize-image", type: "text/html", contains: ["사진 크기 변경"] },
  { path: "/convert-image", type: "text/html", contains: ["사진 형식 변환"] },
  { path: "/batch-compress", type: "text/html", contains: ["여러 사진"] },
  { path: "/guide/photo-500kb", type: "text/html", contains: ["500KB"] },
  { path: "/robots.txt", type: "text/plain", contains: ["Sitemap:", `${baseUrl}/sitemap.xml`] },
  {
    path: "/sitemap.xml",
    type: "application/xml",
    contains: ["/resize-image", "/convert-image", "/batch-compress", "/guide/photo-500kb"],
  },
];

const results = await Promise.all(checks.map(async (check) => {
  const url = new URL(check.path, baseUrl);
  const started = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "FilefitScheduledMonitor/1.0" },
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const problems = [];
    if (!response.ok) problems.push(`HTTP ${response.status}`);
    if (!contentType.toLowerCase().includes(check.type)) problems.push(`content-type: ${contentType || "없음"}`);
    for (const marker of check.contains) {
      if (!body.includes(marker)) problems.push(`필수 내용 누락: ${marker}`);
    }
    return { path: check.path, ms: Math.round(performance.now() - started), problems };
  } catch (error) {
    return {
      path: check.path,
      ms: Math.round(performance.now() - started),
      problems: [error instanceof Error ? error.message : String(error)],
    };
  }
}));

const failed = results.filter((result) => result.problems.length > 0);
const lines = [
  "## 파일핏 사이트 상태 점검",
  "",
  `점검 시각: ${new Date().toISOString()}`,
  "",
  "| 경로 | 응답 시간 | 결과 |",
  "| --- | ---: | --- |",
  ...results.map((result) => `| ${result.path} | ${result.ms}ms | ${result.problems.length ? `실패 — ${result.problems.join("; ")}` : "정상"} |`),
  "",
];

const report = lines.join("\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report, "utf8");
if (failed.length) process.exitCode = 1;
