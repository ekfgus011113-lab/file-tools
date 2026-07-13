import type { Metadata } from "next";

const pageUrl = "https://filefit.kr/guide/resize-photo-pixels";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "사진 크기 줄이기: 가로·세로 픽셀 변경 방법",
  description: "사진 비율을 유지하면서 가로·세로 픽셀 크기를 변경하는 방법",
  url: pageUrl,
  totalTime: "PT1M",
  step: [
    { "@type": "HowToStep", name: "사진 선택", text: "파일핏에서 크기를 변경할 JPG, PNG 또는 WEBP 사진을 선택합니다." },
    { "@type": "HowToStep", name: "가로 크기 입력", text: "비율 유지를 켠 상태에서 원하는 가로 픽셀을 입력합니다." },
    { "@type": "HowToStep", name: "결과 저장", text: "변경 전후 픽셀 크기를 확인하고 결과 사진을 저장합니다." },
  ],
};

export const metadata: Metadata = {
  title: "사진 크기 줄이기 - 가로 세로 픽셀 변경 방법",
  description:
    "사진이 찌그러지지 않게 비율을 유지하면서 가로·세로 픽셀 크기를 줄이는 방법을 알아보세요. 설치 없이 바로 변경할 수 있습니다.",
  alternates: { canonical: "/guide/resize-photo-pixels" },
  openGraph: {
    title: "사진 크기 줄이기 - 가로 세로 픽셀 변경 방법 | 파일핏",
    description: "사진 비율을 유지하며 1920px, 1280px, 1080px 등 원하는 크기로 바꾸는 방법을 확인하세요.",
    url: pageUrl,
  },
};

export default function ResizePhotoPixelsGuide() {
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
        <a className="header-tool-link" href="/resize-image">사진 크기 변경</a>
      </header>

      <article className="article-shell">
        <div className="article-kicker">사진 크기 가이드</div>
        <h1>사진 크기 줄이기,<br /><strong>가로·세로 픽셀 변경 방법</strong></h1>
        <p className="article-lead">
          사진이 너무 크거나 업로드 화면에서 권장 픽셀을 요구한다면 가로·세로 크기를 조절하세요.
          비율 유지를 켜고 한쪽 값만 입력하면 사진이 찌그러지지 않게 다른 값이 자동으로 계산됩니다.
        </p>

        <aside className="quick-answer" aria-label="사진 크기 빠르게 줄이는 방법">
          <span>가장 빠른 방법</span>
          <ol>
            <li>크기를 바꿀 사진을 선택합니다.</li>
            <li><strong>비율 유지</strong>를 켜고 원하는 가로 픽셀을 입력합니다.</li>
            <li>변경 전후 크기를 확인하고 결과를 저장합니다.</li>
          </ol>
          <a href="/resize-image">사진 픽셀 크기 변경하기 <span aria-hidden="true">→</span></a>
        </aside>

        <section>
          <h2>픽셀 크기와 파일 용량은 다릅니다</h2>
          <p>
            픽셀은 사진의 가로·세로 크기를 나타내고, KB와 MB는 저장 공간의 크기를 나타냅니다.
            가로·세로 픽셀을 줄이면 파일 용량도 작아지는 경우가 많지만 정확한 KB까지 맞춰지는 것은 아닙니다.
          </p>
          <ul className="check-list">
            <li><strong>가로·세로 제한</strong><span>사진 크기 변경 도구에서 픽셀을 조절합니다.</span></li>
            <li><strong>500KB 이하 제한</strong><span>사진 용량 줄이기 도구에서 목표 KB를 선택합니다.</span></li>
            <li><strong>두 조건 모두</strong><span>먼저 픽셀을 변경한 뒤 결과 파일의 용량을 확인합니다.</span></li>
          </ul>
        </section>

        <section>
          <h2>사진이 찌그러지지 않게 줄이는 순서</h2>
          <div className="article-steps">
            <div><b>1</b><h3>원본 사진 선택</h3><p>JPG, PNG, WEBP 사진을 선택하면 현재 가로·세로 크기를 확인할 수 있습니다.</p></div>
            <div><b>2</b><h3>비율 유지 확인</h3><p>비율 유지가 켜져 있으면 가로 또는 세로 한쪽만 바꿔도 다른 값이 자동 계산됩니다.</p></div>
            <div><b>3</b><h3>결과 확인 및 저장</h3><p>변경 전후 픽셀과 파일 용량을 확인한 뒤 새 사진을 저장합니다.</p></div>
          </div>
        </section>

        <section>
          <h2>어떤 가로 크기를 선택하면 될까요?</h2>
          <p>제출처에서 정확한 규격을 지정했다면 그 값을 우선 사용하세요. 별도 규격이 없다면 아래 예시에서 용도와 가까운 크기를 선택할 수 있습니다.</p>
          <div className="format-comparison" role="table" aria-label="사진 가로 픽셀 크기 예시">
            <div className="format-comparison-head" role="row">
              <span role="columnheader">가로 크기</span><strong role="columnheader">활용 예시</strong><strong role="columnheader">특징</strong>
            </div>
            <div role="row"><span role="cell">1920px</span><b role="cell">큰 화면·고해상도 공유</b><b role="cell">세부 표현을 많이 유지</b></div>
            <div role="row"><span role="cell">1280px</span><b role="cell">웹 게시·일반 공유</b><b role="cell">선명도와 용량의 균형</b></div>
            <div role="row"><span role="cell">1080px</span><b role="cell">휴대폰 중심 공유</b><b role="cell">화면에서 보기 편한 크기</b></div>
            <div role="row"><span role="cell">800px</span><b role="cell">문서 첨부·작은 미리보기</b><b role="cell">용량을 줄이기 쉬움</b></div>
          </div>
        </section>

        <section>
          <h2>비율 유지는 왜 필요한가요?</h2>
          <p>
            원본의 가로와 세로 비율을 유지하지 않고 두 값을 따로 바꾸면 인물이 넓어지거나 사물이 길어지는 것처럼 사진이 찌그러질 수 있습니다.
            특별히 정확한 가로·세로 규격에 맞춰야 하는 경우가 아니라면 비율 유지를 켜는 것이 안전합니다.
          </p>
        </section>

        <section className="article-faq">
          <h2>자주 묻는 질문</h2>
          <details>
            <summary>사진 크기를 줄이면 화질도 떨어지나요?</summary>
            <p>픽셀 수가 줄어들기 때문에 크게 확대하면 원본보다 덜 선명할 수 있습니다. 실제 사용할 화면 크기에 맞춰 필요한 만큼만 줄이는 것이 좋습니다.</p>
          </details>
          <details>
            <summary>가로 크기만 입력해도 되나요?</summary>
            <p>비율 유지가 켜져 있으면 가로 값을 바꿀 때 세로 값이 원본 비율에 맞춰 자동 계산됩니다.</p>
          </details>
          <details>
            <summary>사진 크기를 키워도 더 선명해지나요?</summary>
            <p>픽셀 크기를 크게 만들 수는 있지만 원본에 없던 세부 정보가 생기지는 않습니다. 작은 사진을 지나치게 키우면 흐릿하게 보일 수 있습니다.</p>
          </details>
        </section>

        <div className="article-cta">
          <span>원하는 픽셀을 알고 있나요?</span>
          <h2>비율을 유지하면서 가로·세로 크기를 바로 변경하세요.</h2>
          <a href="/resize-image">파일핏에서 사진 크기 변경하기</a>
        </div>
      </article>

      <footer className="article-footer">
        <strong>파일핏</strong>
        <a href="/">사진 용량 줄이기 도구로 돌아가기</a>
      </footer>
    </main>
  );
}
