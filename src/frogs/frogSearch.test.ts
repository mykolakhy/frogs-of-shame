import { describe, expect, it } from "vitest";
import { matchesFrogQuery, type Frog } from "./frogSearch";

const frog: Frog = {
  id: "cosmic",
  title: "Cosmic Frog",
  file: "cosmic_frog.png",
  description: "A purple galaxy frog with planets and nebula texture.",
  tags: ["space", "galaxy", "purple"],
};

describe("matchesFrogQuery", () => {
  it("matches every frog for an empty or whitespace-only query", () => {
    expect(matchesFrogQuery(frog, "")).toBe(true);
    expect(matchesFrogQuery(frog, "   ")).toBe(true);
  });

  it("matches title and metadata case-insensitively", () => {
    expect(matchesFrogQuery(frog, "COSMIC")).toBe(true);
    expect(matchesFrogQuery(frog, "purple")).toBe(true);
    expect(matchesFrogQuery(frog, "nebula")).toBe(true);
    expect(matchesFrogQuery(frog, "cosmic_frog.png")).toBe(true);
  });

  it("requires every search word to match", () => {
    expect(matchesFrogQuery(frog, "purple galaxy")).toBe(true);
    expect(matchesFrogQuery(frog, "purple castle")).toBe(false);
  });

  it("ignores repeated whitespace between words", () => {
    expect(matchesFrogQuery(frog, "  cosmic   planets ")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesFrogQuery(frog, "bureaucratic")).toBe(false);
  });
});
