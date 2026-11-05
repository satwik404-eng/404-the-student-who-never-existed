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
  await page.getByRole("button", { name: "ENTER CHAPTER 01" }).click();
}
async function answer(page: Page, value: string) {
  await page.getByRole("textbox", { name: "Mission answer" }).fill(value);
  await page.getByRole("button", { name: "VERIFY DISCOVERY" }).click();
  await expect(
    page.getByText("added to your journal.", { exact: false }),
  ).toBeVisible();
  if (await page.getByRole("button", { name: "Skip story event" }).isVisible())
    await page.getByRole("button", { name: "Skip story event" }).click();
}
async function next(page: Page) {
  if (await page.getByRole("button", { name: "Skip story event" }).isVisible())
    await page.getByRole("button", { name: "Skip story event" }).click();
  await page.getByRole("link", { name: "NEXT CHAPTER" }).click();
  await page.getByRole("button", { name: /ENTER CHAPTER 0/ }).click();
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
  await page.getByRole("button", { name: "LOAD INTERCEPTED SIGNAL" }).click();
  await expect(
    page.getByPlaceholder("Paste the encoded transmission"),
  ).toHaveValue("UkVHT0xJVEg=");
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
  await page.getByRole("link", { name: "OPEN SUSPECT BOARD" }).click();
  await expect(
    page.getByRole("region", { name: "0xNULL case file" }),
  ).toContainText("denies purge");
  await expect(page.locator(".suspect-board")).not.toContainText(
    "Aarya’s emergency protocol",
  );
  await page.getByLabel("CURRENT THEORY").selectOption("archivist");
  await page.getByRole("button", { name: "RECORD THEORY" }).click();
  await page
    .getByRole("checkbox", { name: "Recovered log fragments", exact: true })
    .check();
  await page.reload();
  await expect(page.locator(".theory-history")).toContainText("ARCHIVIST");
  await expect(
    page.getByRole("checkbox", {
      name: "Recovered log fragments",
      exact: true,
    }),
  ).toBeChecked();
  await page.goto("/investigation/mission/4");
  await expect(page.locator(".workspace-top")).toContainText("500 XP");
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
  await page.getByRole("button", { name: "Skip story event" }).click();
  await page.getByRole("button", { name: "REPLAY RECOVERY EVENT" }).click();
  await expect(page.getByRole("dialog")).toContainText(/EMERGENCY/i);
  await page.getByRole("button", { name: "Skip story event" }).click();
  await next(page);
  await expect(page.locator(".firewall-countdown")).toContainText("ARCHIVIST");
  await expect(page.locator(".mission-workspace .student-card")).toContainText(
    "ID REDACTED",
  );
  await expect(
    page.locator(".mission-workspace .student-card"),
  ).not.toContainText("AS-042");
  await page.getByRole("link", { name: "REOPEN YOUR EVIDENCE" }).click();
  await expect(page.locator(".evidence-detail")).toContainText("AS-042");
  await page.goto("/investigation/mission/6");
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
  await page
    .getByRole("link", { name: "REWATCH THE PURGE / RECOVERED PERSPECTIVE" })
    .click();
  await page
    .getByRole("button", { name: "SHOW RECOVERED PERSPECTIVE" })
    .click();
  await expect(page.locator(".perspective-toggle")).toContainText("unverified");
  await page.getByRole("button", { name: "SKIP INTRO" }).click();
  await expect(page.locator(".score-display")).toContainText("750");
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

test("public preview conceals the operator scene and later chapter names", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator(".chapter-preview-item").filter({ hasText: "CLASSIFIED" }),
  ).toHaveCount(4);
  await expect(page.locator(".chapter-preview")).not.toContainText(
    "The false confession",
  );
  await page
    .getByRole("button", { name: "Watch the opening transmission" })
    .click();
  await expect(
    page.getByRole("region", { name: "Public transmission teaser" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toContainText(
    "EXECUTING IDENTITY PURGE",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Watch the opening transmission" }),
  ).toBeFocused();
});

test("registration precedes the full prologue; timed scenes and intercept work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.clock.install();
  await page.goto("/boot");
  await expect(
    page.getByRole("textbox", { name: "DETECTIVE NAME" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "The Purge cinematic" }),
  ).not.toBeVisible();
  await page
    .getByRole("textbox", { name: "DETECTIVE NAME" })
    .fill("Cinematic Witness");
  await page.getByRole("button", { name: "REGISTER WITNESS" }).click();
  await expect(
    page.getByRole("region", { name: "The Purge cinematic" }),
  ).toBeVisible();
  await page.clock.runFor(12000);
  await expect(page.getByText("EXECUTING IDENTITY PURGE")).toBeVisible();
  await expect(page.getByText("0xNULL", { exact: true })).toBeVisible();
  const controls = await page.locator(".cinema-controls").boundingBox();
  expect(controls && controls.y + controls.height <= 720).toBe(true);
  await page.screenshot({ path: "../../outputs/v3-prologue-desktop.png" });
  await page.clock.runFor(35000);
  await expect(
    page.getByRole("button", { name: "INTERCEPT TRANSMISSION" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "INTERCEPT TRANSMISSION" }).click();
  await expect(page.locator(".score-display")).toContainText("0");
  await page.reload();
  await expect(
    page.getByRole("link", { name: "OPEN CASE FILE" }),
  ).toBeVisible();
});

test("chapter introductions persist, replay freely and preserve locked gates", async ({
  page,
}) => {
  await begin(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "OPEN SOURCE MIRROR" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Chapter 1 introduction" }),
  ).not.toBeVisible();
  await page.getByRole("link", { name: "REPLAY CHAPTER INTRO" }).click();
  await expect(
    page.getByRole("region", { name: "Chapter 1 introduction" }),
  ).toBeVisible();
  await expect(page.locator(".chapter-intro-copy h1")).toHaveCSS(
    "opacity",
    "1",
  );
  await page.screenshot({ path: "../../outputs/v3-chapter-desktop.png" });
  await page.getByRole("button", { name: "SKIP CHAPTER INTRO" }).click();
  await expect(page.locator(".workspace-top")).toContainText("0 XP");
  await page.goto("/investigation/mission/5?intro=replay");
  await expect(
    page.getByRole("heading", { name: "This partition is locked." }),
  ).toBeVisible();
  await expect(
    page.getByText("The false confession", { exact: true }),
  ).not.toBeVisible();
});

test("mobile reduced-motion cinematic is manual and the suspect board saves theories", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/boot");
  await page
    .getByRole("textbox", { name: "DETECTIVE NAME" })
    .fill("Mobile Witness");
  await page.getByRole("button", { name: "REGISTER WITNESS" }).click();
  await expect(page.getByText("SECURITY ARCHIVE / 02:17 AM")).toBeVisible();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "NEXT SCENE" }).click();
  await page.getByRole("button", { name: "INTERCEPT TRANSMISSION" }).click();
  await page
    .getByRole("link", { name: "Suspect board Accusations are not evidence" })
    .click();
  await expect(
    page.getByRole("button", { name: /SEALED PROFILE/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "RECORD THEORY" }).click();
  await page.getByLabel("CURRENT THEORY").selectOption("echo");
  await page.getByRole("button", { name: "REVISE THEORY" }).click();
  await expect(page.getByRole("status")).toContainText("Theory revised");
  await page.reload();
  await expect(page.locator(".theory-history li")).toHaveCount(2);
  await expect(page.locator(".suspect-board")).not.toContainText(
    "emergency preservation identity",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../../outputs/v3-suspects-mobile.png",
    fullPage: true,
  });
});

test("the same account resumes stage two in another browser without replaying earlier cinematics", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const pa = await a.newPage();
  await begin(pa);
  await answer(pa, "ORBIT");
  await next(pa);
  await expect(
    pa.getByPlaceholder("Paste the encoded transmission"),
  ).toBeVisible();
  // Both isolated browser stores use the same development test identity.
  // Production binds this identity to Google Auth.getUser rather than a cookie.
  await b.addCookies(await a.cookies());
  const pb = await b.newPage();
  await pb.goto("/boot");
  await expect(pb).toHaveURL(/investigation$/);
  await expect(
    pb.getByRole("region", { name: "The Purge cinematic" }),
  ).not.toBeVisible();
  await expect(pb.locator(".score-display")).toContainText("125");
  await pb.goto("/investigation/mission/1");
  await expect(
    pb.getByText("Archive access key added to your journal."),
  ).toBeVisible();
  await expect(
    pb.getByRole("region", { name: "Chapter 1 introduction" }),
  ).not.toBeVisible();
  await pb.goto("/investigation/mission/2");
  await expect(
    pb.getByPlaceholder("Paste the encoded transmission"),
  ).toBeVisible();
  await expect(
    pb.getByRole("region", { name: "Chapter 2 introduction" }),
  ).not.toBeVisible();
  await expect(pb.getByRole("dialog")).not.toBeVisible();
  await answer(pb, "REGOLITH");
  await pb.getByRole("link", { name: "NEXT CHAPTER" }).click();
  await expect(
    pb.getByRole("region", { name: "Chapter 3 introduction" }),
  ).toBeVisible();
  await pb.getByRole("button", { name: "ENTER CHAPTER 03" }).click();
  await pb.goto("/investigation/mission/1?intro=replay");
  await expect(
    pb.getByRole("region", { name: "Chapter 1 introduction" }),
  ).toBeVisible();
  await pb.getByRole("button", { name: "SKIP CHAPTER INTRO" }).click();
  await expect(pb.locator(".workspace-top")).toContainText("250 XP");
  await a.close();
  await b.close();
});

test("elapsed investigation timer respects settings without changing progression", async ({
  page,
}) => {
  await begin(page);
  await expect(page.getByLabel("Investigation elapsed time")).toBeVisible();
  await page.goto("/settings");
  await page
    .getByRole("checkbox", { name: /Show investigation timer/ })
    .uncheck();
  await page.goto("/investigation");
  await expect(page.getByLabel("Investigation elapsed time")).not.toBeVisible();
  await page.goto("/settings");
  await page
    .getByRole("checkbox", { name: /Show investigation timer/ })
    .check();
  await page.goto("/investigation");
  await expect(page.getByLabel("Investigation elapsed time")).toBeVisible();
  await expect(page.locator(".score-display")).toContainText("0");
});
