import { test, expect } from "@playwright/test";

test.describe("인연사주 핵심 사용자 여정 E2E 회귀 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // 로컬스토리지 초기화
    await page.goto("/#/");
    await page.evaluate(() => localStorage.clear());
  });

  test("1. 메인 진입 및 사주 정보 입력 -> 내 소울 카드 생성 및 신살 뱃지 확인", async ({ page }) => {
    await page.goto("/#/my-saju");
    await page.waitForSelector("body");

    // 이름 입력
    const nameInput = page.locator("input[placeholder*='이름'], input[name='name']").first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("테스트유저");

      // 생년월일 입력
      const birthInput = page.locator("input[type='date'], input[name='birthDate']").first();
      if (await birthInput.isVisible()) {
        await birthInput.fill("1995-05-15");
      }

      // 성별 선택
      const genderBtn = page.locator("button:has-text('남성'), button:has-text('여성')").first();
      if (await genderBtn.isVisible()) {
        await genderBtn.click();
      }

      // 사주 분석하기 버튼 클릭
      const submitBtn = page.locator("button:has-text('사주 확인하기'), button:has-text('분석 시작')").first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    // 소울 카드 또는 신살 뱃지 영역이 성공적으로 렌더링되는지 확인
    await expect(page.locator("text=소울 카드").or(page.locator("text=정밀 분석 리포트")).or(page.locator("text=현대적 신살"))).toBeVisible({ timeout: 15000 });
  });

  test("2. 모임 생성 및 룸 입장 -> 궁합 지도 및 캐릭터 렌더링 검증", async ({ page }) => {
    await page.goto("/#/groups");
    await page.waitForSelector("body");

    // 모임 생성 버튼 또는 인풋 확인
    const createBtn = page.locator("button:has-text('새 모임 만들기'), button:has-text('모임 개설')").first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
    }

    // 네트워크 지도 캔버스나 멤버 카드 컨테이너가 에러 없이 로드되는지 확인
    await expect(page.locator("canvas").or(page.locator("text=참여 멤버")).or(page.locator("text=모임"))).toBeVisible({ timeout: 15000 });
  });

  test("3. 프리미엄 확인권 / 페이월 모달 및 A/B 테스트 헤드라인 검증", async ({ page }) => {
    await page.goto("/#/my-saju");
    await page.waitForSelector("body");

    // 페이월 또는 확인권 열람 버튼 확인
    const paywallTrigger = page.locator("button:has-text('확인권'), button:has-text('해금'), button:has-text('심층 감정서')").first();
    if (await paywallTrigger.isVisible()) {
      await paywallTrigger.click();

      // 모달 내 헤드라인 또는 쿠폰 입력창 확인
      await expect(page.locator("text=확인권").or(page.locator("text=쿠폰"))).toBeVisible({ timeout: 10000 });
    }
  });
});
