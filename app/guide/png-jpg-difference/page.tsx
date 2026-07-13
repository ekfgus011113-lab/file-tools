import type { Metadata } from "next";

const pageUrl = "https://filefit.kr/guide/png-jpg-difference";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "PNG와 JPG 차이, 어떤 사진 형식을 써야 할까?",
  description: "PNG와 JPG의 화질, 용량, 투명 배경 차이와 상황별 선택 방법을 쉽게 설명합니다.",
  url: pageUrl,
  inLanguage: "ko-KR",
  author: { "@type": "Organization", name: "파일핏" },
  publisher: { "@type": "Organization", name: "파일핏" },
};

export const metadata: Metadata = {
  title: "PNG JPG 차이와 변환 방법",
  description:
    "PNG와 JPG의 화질, 파일 용량, 투명 배경 차이를 알아보고 사진·화면 캡처·로고에 알맞은 형식을 선택하세요.",
  alternates: { canonical: "/guide/png-jpg-difference" },
  openGraph: {
    title: "PNG JPG 차이와 변환 방법 | 파일핏",
    description: "사진은 JPG, 글자와 투명 배경은 PNG가 유리한 이유를 간단히 확인하세요.",
    url: pageUrl,
  },
};

export default function PngJpgDifferenceGuide() {
  return (
    <main className="article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <header className="site-header article-header">
        <a className="brand" href="/" aria-label="파일핏 처음으로">
          <span className="brand-mark" aria-hidden="true">핏</span>
          <span>파일핏</span>
        </a>
        <a className="header-tool-link" href="/convert-image">사진 형식 변환</a>
      </header>

      <article className="article-shell">
        <div className="article-kicker">사진 형식 가이드</div>
        <h1>PNG와 JPG 차이,<br /><strong>어떤 형식을 써야 할까요?</strong></h1>
        <p className="article-lead">
          사진이라면 대체로 JPG가 용량을 줄이기 쉽고, 글자가 많은 화면 캡처나 투명 배경이 필요하면 PNG가 유리합니다.
          두 형식의 차이를 알면 불필요하게 큰 파일이나 깨진 이미지를 피할 수 있습니다.
        </p>

        <aside className="quick-answer" aria-label="PNG와 JPG 빠른 선택 방법">
          <span>빠른 선택</span>
          <ol>
            <li><strong>일반 사진·제출용 사진</strong>은 JPG</li>
            <li><strong>글자·도형이 많은 화면 캡처</strong>는 PNG</li>
            <li><strong>투명 배경 로고</strong>는 PNG</li>
          </ol>
          <a href="/convert-image">PNG·JPG 형식 바꾸기 <span aria-hidden="true">→</span></a>
        </aside>

        <section>
          <h2>PNG와 JPG의 핵심 차이</h2>
          <div className="format-comparison" role="table" aria-label="PNG와 JPG 형식 비교">
            <div className="format-comparison-head" role="row">
              <span role="columnheader">비교 항목</span><strong role="columnheader">JPG</strong><strong role="columnheader">PNG</strong>
            </div>
            <div role="row"><span role="cell">잘 맞는 이미지</span><b role="cell">일반 사진</b><b role="cell">화면 캡처·로고</b></div>
            <div role="row"><span role="cell">파일 용량</span><b role="cell">비교적 작게 만들기 쉬움</b><b role="cell">사진에서는 커질 수 있음</b></div>
            <div role="row"><span role="cell">투명 배경</span><b role="cell">지원하지 않음</b><b role="cell">지원함</b></div>
            <div role="row"><span role="cell">반복 저장</span><b role="cell">화질이 더 낮아질 수 있음</b><b role="cell">원본 정보 보존에 유리</b></div>
          </div>
        </section>

        <section>
          <h2>JPG를 선택하면 좋은 경우</h2>
          <p>
            휴대폰으로 찍은 풍경, 인물, 음식처럼 색 변화가 많은 사진은 JPG가 잘 맞습니다.
            눈에 잘 띄지 않는 세부 정보를 일부 줄여 파일 크기를 작게 만들 수 있기 때문입니다.
          </p>
          <ul className="check-list">
            <li><strong>온라인 제출</strong><span>용량 제한이 있는 증명사진이나 첨부 사진</span></li>
            <li><strong>공유용 사진</strong><span>이메일이나 게시글에 올릴 일반 사진</span></li>
            <li><strong>작은 용량 우선</strong><span>투명 배경보다 전송 속도와 용량이 중요한 경우</span></li>
          </ul>
        </section>

        <section>
          <h2>PNG를 선택하면 좋은 경우</h2>
          <p>
            글자, 선, 아이콘처럼 경계가 뚜렷한 이미지는 PNG가 선명하게 보존하기 좋습니다.
            배경이 비치는 로고나 스티커처럼 투명 영역이 필요한 이미지에도 PNG를 사용해야 합니다.
          </p>
          <ul className="check-list">
            <li><strong>화면 캡처</strong><span>작은 글자와 메뉴가 포함된 프로그램 화면</span></li>
            <li><strong>로고·아이콘</strong><span>선명한 윤곽과 단색 면이 중요한 이미지</span></li>
            <li><strong>투명 배경</strong><span>다른 배경 위에 자연스럽게 올려야 하는 이미지</span></li>
          </ul>
        </section>

        <section>
          <h2>PNG를 JPG로 바꾸면 무엇이 달라질까요?</h2>
          <p>
            파일 용량은 줄어들 수 있지만 투명한 부분은 JPG에서 표현할 수 없습니다.
            파일핏은 PNG를 JPG로 바꿀 때 투명 영역을 흰색으로 채워 결과가 검게 보이는 문제를 막습니다.
            변환 후에는 작은 글자와 배경 부분이 원하는 모습인지 한 번 확인하세요.
          </p>
        </section>

        <section className="article-faq">
          <h2>자주 묻는 질문</h2>
          <details>
            <summary>JPG와 JPEG는 다른 형식인가요?</summary>
            <p>확장자 표기 길이만 다를 뿐 같은 이미지 형식입니다. 대부분의 서비스에서 동일하게 취급합니다.</p>
          </details>
          <details>
            <summary>PNG를 JPG로 바꾸면 무조건 용량이 줄어드나요?</summary>
            <p>사진에서는 줄어드는 경우가 많지만 이미지 내용과 저장 화질에 따라 결과가 달라집니다. 변환 후 실제 파일 크기를 확인하는 것이 정확합니다.</p>
          </details>
          <details>
            <summary>형식을 바꾸면 사진 크기도 바뀌나요?</summary>
            <p>파일핏의 형식 변환 도구는 가로·세로 픽셀을 유지하고 파일 형식만 바꿉니다.</p>
          </details>
        </section>

        <div className="article-cta">
          <span>형식을 잘못 선택했나요?</span>
          <h2>설치 없이 JPG·PNG·WEBP로 바로 바꿔보세요.</h2>
          <a href="/convert-image">파일핏에서 사진 형식 변환하기</a>
        </div>
      </article>

      <footer className="article-footer">
        <strong>파일핏</strong>
        <a href="/">사진 용량 줄이기 도구로 돌아가기</a>
      </footer>
    </main>
  );
}
