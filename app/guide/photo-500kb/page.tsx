import type { Metadata } from "next";

const pageUrl = "https://filefit.kr/guide/photo-500kb";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "휴대폰 사진을 500KB 이하로 줄이는 방법",
  description: "설치 없이 휴대폰 사진을 500KB 이하로 줄이고 결과를 확인하는 간단한 방법",
  url: pageUrl,
  totalTime: "PT1M",
  step: [
    { "@type": "HowToStep", name: "사진 선택", text: "파일핏에서 줄일 JPG, PNG 또는 WEBP 사진을 선택합니다." },
    { "@type": "HowToStep", name: "500KB 선택", text: "목표 용량에서 500KB를 선택합니다." },
    { "@type": "HowToStep", name: "압축 및 저장", text: "사진 용량 줄이기를 누른 뒤 결과 크기를 확인하고 저장합니다." },
  ],
};

export const metadata: Metadata = {
  title: "휴대폰 사진을 500KB 이하로 줄이는 방법",
  description:
    "휴대폰 사진을 500KB 이하로 줄이는 가장 간단한 방법을 알아보세요. 설치와 가입 없이 파일핏에서 바로 압축할 수 있습니다.",
  alternates: { canonical: "/guide/photo-500kb" },
  openGraph: {
    title: "휴대폰 사진을 500KB 이하로 줄이는 방법 | 파일핏",
    description: "사진 선택부터 500KB 이하 압축과 저장까지 한 번에 확인하세요.",
    url: pageUrl,
  },
};

export default function Photo500KbGuide() {
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
        <a className="header-tool-link" href="/#top">사진 용량 줄이기</a>
      </header>

      <article className="article-shell">
        <div className="article-kicker">사진 용량 가이드</div>
        <h1>휴대폰 사진을<br /><strong>500KB 이하로 줄이는 방법</strong></h1>
        <p className="article-lead">
          사진 제출 화면에서 500KB 제한에 걸렸다면 별도 앱을 설치할 필요가 없습니다.
          사진을 선택하고 목표 용량만 지정하면 기기 안에서 바로 줄일 수 있습니다.
        </p>

        <aside className="quick-answer" aria-label="빠른 해결 방법">
          <span>가장 빠른 방법</span>
          <ol>
            <li>파일핏에서 사진을 선택합니다.</li>
            <li>목표 용량으로 <strong>500KB</strong>를 선택합니다.</li>
            <li>압축 결과가 500KB 이하인지 확인하고 저장합니다.</li>
          </ol>
          <a href="/#top">사진을 500KB 이하로 줄이기 <span aria-hidden="true">→</span></a>
        </aside>

        <section>
          <h2>사진 용량이 500KB를 넘는 이유</h2>
          <p>
            휴대폰 카메라는 선명한 사진을 만들기 위해 큰 해상도와 많은 색상 정보를 저장합니다.
            그래서 화면으로 볼 때는 평범해 보여도 파일 크기는 수 MB가 될 수 있습니다.
          </p>
          <p>
            용량을 줄일 때는 화질만 낮추는 것이 아니라 사진의 가로·세로 크기도 함께 조절해야
            글자와 윤곽을 비교적 선명하게 유지하면서 목표 크기에 맞추기 쉽습니다.
          </p>
        </section>

        <section>
          <h2>500KB 이하로 줄이는 순서</h2>
          <div className="article-steps">
            <div><b>1</b><h3>원본 사진 선택</h3><p>JPG, PNG, WEBP 사진을 선택하세요. 파일은 서버로 전송되지 않습니다.</p></div>
            <div><b>2</b><h3>목표 용량 선택</h3><p>500KB 버튼을 선택하면 화질과 해상도를 자동으로 조절합니다.</p></div>
            <div><b>3</b><h3>결과 확인 및 저장</h3><p>압축 후 용량과 감소율을 확인하고 새 사진을 기기에 저장하세요.</p></div>
          </div>
        </section>

        <section>
          <h2>압축 후 꼭 확인할 것</h2>
          <ul className="check-list">
            <li><strong>파일 크기</strong><span>결과가 실제로 500KB 이하인지 확인합니다.</span></li>
            <li><strong>글자 선명도</strong><span>문서나 화면 캡처라면 작은 글자가 읽히는지 확대해 봅니다.</span></li>
            <li><strong>사진 방향</strong><span>세로 사진이 회전하거나 잘리지 않았는지 확인합니다.</span></li>
            <li><strong>파일 형식</strong><span>제출처에서 JPG 또는 PNG 형식을 지정했는지 확인합니다.</span></li>
          </ul>
        </section>

        <section>
          <h2>KB와 MB는 얼마나 차이 날까요?</h2>
          <p>
            1MB는 일반적으로 1,024KB로 계산합니다. 따라서 500KB는 1MB의 절반보다 조금 작은 크기입니다.
            3MB 사진을 500KB로 줄이면 원본의 약 6분의 1 수준이므로 사진에 따라 해상도가 함께 줄어들 수 있습니다.
          </p>
        </section>

        <section className="article-faq">
          <h2>자주 묻는 질문</h2>
          <details>
            <summary>정확히 500KB가 아니라 더 작아도 괜찮나요?</summary>
            <p>‘500KB 이하’ 조건이라면 500KB보다 작은 파일도 제출할 수 있습니다.</p>
          </details>
          <details>
            <summary>PNG가 JPG로 바뀔 수 있나요?</summary>
            <p>투명 배경이 없는 일반 PNG는 더 많은 해상도를 유지하기 위해 JPG로 바뀔 수 있습니다. 투명 배경이 있으면 PNG를 유지합니다.</p>
          </details>
          <details>
            <summary>사진이 서버에 저장되나요?</summary>
            <p>파일핏은 사진을 서버에 올리지 않고 현재 사용하는 휴대폰이나 컴퓨터의 브라우저 안에서 처리합니다.</p>
          </details>
        </section>

        <div className="article-cta">
          <span>이제 직접 줄여보세요</span>
          <h2>사진을 선택하면 500KB 이하로 자동 조절합니다.</h2>
          <a href="/#top">파일핏에서 사진 용량 줄이기</a>
        </div>
      </article>

      <footer className="article-footer">
        <strong>파일핏</strong>
        <a href="/">사진 용량 줄이기 도구로 돌아가기</a>
      </footer>
    </main>
  );
}
