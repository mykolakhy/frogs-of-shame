#!/usr/bin/env bash

set -euo pipefail

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp is required to generate frog previews. Install it with: brew install webp" >&2
  exit 1
fi

source_dir="public/assets/frogs"
preview_dir="${source_dir}/previews"

mkdir -p "$preview_dir"

for source in "${source_dir}"/*.png; do
  filename="$(basename "$source" .png)"
  cwebp -quiet -mt -resize 640 0 -q 82 "$source" -o "${preview_dir}/${filename}.webp"
done

echo "Generated $(find "$preview_dir" -maxdepth 1 -type f -name '*.webp' | wc -l | tr -d ' ') WebP previews in ${preview_dir}."
