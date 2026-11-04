// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Landing, Boot } from "../src/Pages";
import { Modal } from "../src/ui";
import { decodeBase64 } from "../src/Investigation";
afterEach(cleanup);
describe("accessible starting experience", () => {
  it("renders a playable entry point and source-oriented premise", () => {
    render(
      <MemoryRouter>
        <Landing onGuide={() => undefined} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Someone",
    );
    expect(
      screen
        .getByRole("link", { name: "BEGIN INVESTIGATION" })
        .getAttribute("href"),
    ).toBe("/boot");
    expect(
      screen.getByRole("button", { name: "Open the field guide" }),
    ).toBeTruthy();
  });
  it("provides a skip control during the boot cinematic", () => {
    render(
      <MemoryRouter>
        <Boot />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "SKIP INTRO" })).toBeTruthy();
    expect(screen.getByText("INITIALIZING ARCHIVE…")).toBeTruthy();
  });
  it("exposes a focusable modal with a close control", () => {
    render(
      <Modal title="Field guide" onClose={() => undefined}>
        <p>A vague next move.</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("button", { name: "Close guide" })).toBeTruthy();
  });
  it("decodes valid Base64 and rejects malformed transmissions", () => {
    expect(decodeBase64("UkVHT0xJVEg=")).toBe("REGOLITH");
    expect(() => decodeBase64("! invalid")).toThrow();
    expect(() => decodeBase64("")).toThrow();
  });
});
