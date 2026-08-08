import type { Frog } from "./frogSearch";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isFrog(value: unknown): value is Frog {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.file === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string")
  );
}

export function parseFrogCatalog(value: unknown): Frog[] {
  if (!Array.isArray(value) || !value.every(isFrog)) {
    throw new Error("Frog catalog has an invalid shape.");
  }

  return value;
}
