import { test, expect, type Page } from "@playwright/test";
async function begin(page: Page) {
  await page.goto("/");
  await page
    .getByRole("link", { name: "BEGIN INVESTIGATION", exact: true })
    .click();
  await expect(page.locator(".boot-page,.onboarding")).toBeVisible();
  if (await page.getByRole("textbox", { name: "DETECTIVE NAME" }).isVisible()) {
    await page
      .getByRole("textbox", { name: "DETECTIVE NAME" })
      .fill("Test Detective");
    await page.getByRole("button", { name: "REGISTER WITNESS" }).click();
  }
  await page.getByRole("button", { name: "SKIP INTRO" }).click();
  await expect(
    page.getByRole("heading", { name: "The archive remembers." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "OPEN CASE FILE" }).click();
}
async function answer(page: Page, value: string) {
  await page.getByRole("textbox", { name: "Mission answer" }).fill(value);
  await page.getByRole("button", { name: "VERIFY DISCOVERY" }).click();
  await expect(
    page.getByText("added to your journal.", { exact: false }),
  ).toBeVisible();
}
async function next(page: Page) {
  await page.getByRole("link", { name: "NEXT CHAPTER" }).click();
}
test("a new witness solves all six chapters, persists evidence and reaches both endings", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  await page.getByRole("button", { name: "OPEN SOURCE MIRROR" }).click();
  await expect(page.getByLabel("Original HTML source")).toContainText(
    "ARCHIVE_ACCESS: ORBIT",
  );
  await answer(page, "ORBIT");
  await page.reload();
  await expect(
    page.getByText("Archive access key added to your journal."),
  ).toBeVisible();
  await next(page);
  await page
    .getByPlaceholder("Paste the encoded transmission")
    .fill("UkVHT0xJVEg=");
  await page.getByRole("button", { name: "DECODE SIGNAL" }).click();
  await expect(page.getByText("REGOLITH", { exact: true })).toBeVisible();
  await answer(page, "REGOLITH");
  await next(page);
  await expect(
    page.getByText("[IDENTITY DELETED]", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RAW JSON" }).click();
  await expect(page.locator(".json-view")).toContainText(
    "2026-11-05T03:42:00Z",
  );
  await answer(page, "AS-042");
  await next(page);
  for (const command of [
    "help",
    "ls /",
    "cat /logs/access.log",
    "cat /archive/backup.log",
    "cat /classified/witness.log",
  ]) {
    await page.getByRole("textbox", { name: "Terminal command" }).fill(command);
    await page.getByRole("button", { name: "Run command" }).click();
    await expect(
      page.getByRole("textbox", { name: "Terminal command" }),
    ).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "Run command" }),
    ).toBeEnabled();
  }
  await expect(page.getByText("3/3 FRAGMENTS")).toBeVisible();
  await answer(page, "WE WERE HERE");
  await next(page);
  await page
    .getByRole("button", { name: "Move Unauthorized edits discovered earlier" })
    .click();
  await page
    .getByRole("button", { name: "Move Unauthorized edits discovered earlier" })
    .click();
  await page
    .getByRole("button", { name: "Move Unauthorized edits discovered earlier" })
    .click();
  await page
    .getByRole("button", { name: "Move Recovery routine written earlier" })
    .click();
  await page.getByRole("button", { name: "VERIFY TIMELINE" }).click();
  await expect(
    page.getByText("Corrupted audit history added to your journal."),
  ).toBeVisible();
  await next(page);
  await expect(page.locator(".firewall-countdown")).toContainText("ARCHIVIST");
  await answer(page, "AS-042");
  await page
    .getByRole("button", { name: /Give Aarya their name back/ })
    .click();
  await expect(page).toHaveURL(/endings\/restore/);
  await expect(
    page.getByRole("heading", { name: "Aarya Sen exists." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Created by Satwik." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /STAR THE REPOSITORY/ }),
  ).toHaveAttribute("href", /github.com\/satwik404-eng/);
  await expect(page.locator(".result-stats")).toContainText("750 XP");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "DOWNLOAD RESULT CARD" }).click();
  expect((await download).suggestedFilename()).toBe(
    "404-investigation-result.png",
  );
  await page.screenshot({
    path: "../../outputs/ending-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "EXPLORE THE OTHER ENDING" }).click();
  await page
    .getByRole("button", { name: /Give the truth to everyone/ })
    .click();
  await expect(page).toHaveURL(/endings\/expose/);
  await expect(
    page.getByRole("heading", { name: "The truth is out." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("guide is keyboard accessible and never exposes solution words", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "FIELD GUIDE ?" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText("ORBIT");
  await expect(dialog).not.toContainText("REGOLITH");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "FIELD GUIDE ?" }),
  ).toBeFocused();
});
test("mission prerequisites remain locked across direct navigation", async ({
  page,
}) => {
  await begin(page);
  await page.goto("/investigation/mission/6");
  await expect(
    page.getByRole("heading", { name: "This partition is locked." }),
  ).toBeVisible();
});
test("two isolated browsers cooperate, exchange messages, reconnect, and solve the split file", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const pa = await a.newPage(),
    pb = await b.newPage();
  await begin(pa);
  await pa.goto("/multiplayer");
  await pa.getByRole("button", { name: "CREATE A ROOM" }).click();
  await expect(pa).toHaveURL(/multiplayer\/[A-F0-9]{6}/);
  const room = pa.url();
  await begin(pb);
  await pb.goto(room);
  await expect(pb.getByText("Waiting for a second witness…")).not.toBeVisible();
  await pa.getByRole("button", { name: "I’M READY" }).click();
  await pb.getByRole("button", { name: "I’M READY" }).click();
  await expect(
    pa.getByRole("button", { name: "START THE SPLIT FILE" }),
  ).toBeEnabled({ timeout: 15000 });
  await pa.getByRole("button", { name: "START THE SPLIT FILE" }).click();
  await expect(pa.locator(".private-clue")).toContainText("C → A → B");
  await expect(pb.locator(".private-clue")).toContainText("A = WITH", {
    timeout: 15000,
  });
  await expect(pa.locator(".private-clue")).not.toContainText("A = WITH");
  await expect(pb.locator(".private-clue")).not.toContainText("C → A → B");
  await pa
    .getByRole("textbox", { name: "Message your partner" })
    .fill("My order is C, A, B.");
  await pa.getByRole("button", { name: "Send co-op message" }).click();
  await expect(pb.getByRole("log")).toContainText("My order is C, A, B.", {
    timeout: 15000,
  });
  await pb.reload();
  await expect(pb.locator(".private-clue")).toContainText("A = WITH");
  await pb
    .getByRole("textbox", { name: "RECONSTRUCTED PHRASE" })
    .fill("STAY WITH ME");
  await pb.getByRole("button", { name: "RECONCILE FILE" }).click();
  await expect(
    pb.getByRole("heading", { name: "The split file is whole." }),
  ).toBeVisible();
  await expect(
    pa.getByRole("heading", { name: "The split file is whole." }),
  ).toBeVisible({ timeout: 15000 });
  await a.close();
  await b.close();
});
test("mobile landing, navigation, guide and mission workspace stay within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "BEGIN INVESTIGATION", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".hero-copy h1")).toHaveCSS("opacity", "1");
  await expect(page.locator(".art-stage")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "../../outputs/landing-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await begin(page);
  await page.getByRole("button", { name: "OPEN SOURCE MIRROR" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("desktop landing has no overflow or runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Someone",
  );
  await expect(page.locator(".hero-copy h1")).toHaveCSS("opacity", "1");
  await expect(page.locator(".art-stage")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "../../outputs/landing-desktop.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
