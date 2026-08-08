export type Frog = {
  id: string;
  title: string;
  file: string;
  description: string;
  tags: string[];
};

const normalize = (value: string) => value.toLowerCase().trim();

const searchableText = (frog: Frog) =>
  normalize([frog.title, frog.description, frog.file, ...frog.tags].join(" "));

export function matchesFrogQuery(frog: Frog, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return true;
  }

  const haystack = searchableText(frog);
  return words.every((word) => haystack.includes(word));
}
