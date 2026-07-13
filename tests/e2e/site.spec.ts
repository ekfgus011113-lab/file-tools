import { expect, test, type Page } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z8DAwMDAxMDAwMAAAAwBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

const pages = [
  { path: "/", heading: "원하는 크기 이하로" },
  { path: "/resize-image", heading: "원하는 픽셀로 변경" },
  { path: "/convert-image", heading: "사진 형식 변환" },
  { path: "/batch-compress", heading: "한꺼번에 용량 줄이기" },
  { path: "/guide/photo-500kb", heading: "500KB 이하로 줄이는 방법" },
];

async function uploadTestImage(page: Page) {
  const input = page.locator('input[type="file"]');
  await input.waitFor({ state: "attached" });
  await page.waitForFunction(() => {
    const element = document.querySelector('input[type="file"]');
    return element && Object.keys(element).some((key) => key.startsWith("__reactProps$"));
  });
  await input.setInputFiles({
    name: "monitor.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByText("monitor.png")).toBeVisible();
}

for (const entry of pages) {
  test(`${entry.path}가 정상 표시되고 가로로 넘치지 않는다`, async ({ page }) => {
    await page.goto(entry.path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(entry.heading);
    await expect(page.locator("main")).toBeVisible();

    const overflow = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("사진 압축 결과를 만들 수 있다", async ({ page }) => {
  await page.goto("/");
  await uploadTestImage(page);
  await page.getByRole("button", { name: "사진 용량 줄이기" }).click();
  await expect(page.getByRole("link", { name: /압축된 사진 저장하기/ })).toHaveAttribute("href", /^blob:/);
});

test("사진 크기 변경 결과를 만들 수 있다", async ({ page }) => {
  await page.goto("/resize-image");
  await uploadTestImage(page);
  await page.getByLabel("새 가로 크기").fill("1");
  await page.getByRole("button", { name: "사진 크기 변경하기" }).click();
  await expect(page.getByRole("link", { name: /크기 변경한 사진 저장하기/ })).toHaveAttribute("href", /^blob:/);
});

test("사진 형식 변환 결과를 만들 수 있다", async ({ page }) => {
  await page.goto("/convert-image");
  await uploadTestImage(page);
  await page.getByRole("button", { name: /JPG로 변환하기/ }).click();
  await expect(page.getByRole("link", { name: /변환한 사진 저장하기/ })).toHaveAttribute("href", /^blob:/);
});
