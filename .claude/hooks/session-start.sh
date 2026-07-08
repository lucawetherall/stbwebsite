#!/bin/bash
# SessionStart hook: make web sessions (Claude Code on the web) ready to build
# and test immediately. Local checkouts manage their own installs, so this is
# remote-only; the node_modules guard keeps warm/resumed sessions instant.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi
