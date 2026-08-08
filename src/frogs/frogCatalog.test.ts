import { describe, expect, it } from "vitest";
import { isFrog, parseFrogCatalog } from "./frogCatalog";

const validFrog = {
  id: "regular",
  title: "Regular Frog",
  file: "regular_frog.png",
  description: "A regular green frog.",
  tags: ["green", "regular"],
};

describe("frog catalog parsing", () => {
  it("accepts a valid frog entry", () => {
    expect(isFrog(validFrog)).toBe(true);
  });

  it("rejects entries with missing or incorrectly typed fields", () => {
    expect(isFrog({ ...validFrog, tags: ["green", 42] })).toBe(false);
    expect(isFrog({ ...validFrog, title: 42 })).toBe(false);
  });

  it("parses a valid catalog", () => {
    expect(parseFrogCatalog([validFrog])).toEqual([validFrog]);
  });

  it("throws for an invalid catalog", () => {
    expect(() => parseFrogCatalog([validFrog, { id: "broken" }])).toThrow(
      "Frog catalog has an invalid shape.",
    );
  });
});
