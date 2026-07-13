"use client";

const tools = [
  { href: "/", label: "한 장 압축" },
  { href: "/batch-compress", label: "일괄 압축" },
  { href: "/resize-image", label: "크기 변경" },
  { href: "/convert-image", label: "형식 변환" },
];

export function ToolNav({ current }: { current: string }) {
  return (
    <nav className="tool-nav" aria-label="파일핏 도구 메뉴">
      {tools.map((tool) => (
        <a key={tool.href} href={tool.href} className={current === tool.href ? "active" : ""} aria-current={current === tool.href ? "page" : undefined}>
          {tool.label}
        </a>
      ))}
    </nav>
  );
}
