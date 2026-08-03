#!/usr/bin/env bash
set -euo pipefail

read_keychain_entry() {
  security find-generic-password -a "$USER" -s "$1" -w 2>/dev/null || {
    echo "Missing Keychain entry '$1' — see the Secrets section in README.md for setup." >&2
    exit 1
  }
}

BWS_ACCESS_TOKEN="$(read_keychain_entry "THEY_ARE_FROGS_BWS_ACCESS_TOKEN")"
BWS_PROJECT_ID="$(read_keychain_entry "THEY_ARE_FROGS_BWS_PROJECT_ID")"
export BWS_ACCESS_TOKEN

exec bws run --project-id "$BWS_PROJECT_ID" -- "$@"
