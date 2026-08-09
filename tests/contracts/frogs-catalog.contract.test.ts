import frogs from "../../public/assets/frogs.json";
import { describe, expect, test } from "vitest";

describe("public frog catalog contract", () => {
  test("every catalog entry exposes the fields required by FrogWidget", () => {
    expect(Array.isArray(frogs)).toBe(true);
    expect(frogs.length).toBeGreaterThan(0);

    for (const frog of frogs) {
      expect(frog).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          file: expect.any(String),
          description: expect.any(String),
          tags: expect.any(Array),
        }),
      );
      expect(frog.tags.every((tag) => typeof tag === "string")).toBe(true);
    }
  });

  test("catalog ids and asset filenames are unique", () => {
    expect(new Set(frogs.map((frog) => frog.id)).size).toBe(frogs.length);
    expect(new Set(frogs.map((frog) => frog.file)).size).toBe(frogs.length);
  });
});
