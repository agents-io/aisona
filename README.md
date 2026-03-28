# aisona

> Own your AI's persona. Define it once, use it everywhere.

Your AI has a personality — shaped by months of instructions, corrections, and preferences. **aisona** lets you define it in one file (`aisona.yml`) and deploy it to every AI coding tool you use.

## Coming Soon

```bash
npx aisona init                    # Generate aisona.yml from your existing CLAUDE.md
npx aisona export --to cursor      # Deploy your persona to Cursor
npx aisona export --to gemini      # Deploy your persona to Gemini
npx aisona export --all            # Deploy to all enabled tools
npx aisona watch                   # Auto re-export on change + git sync
```

## Why?

- **Your AI's personality is scattered** across `~/.claude/CLAUDE.md`, `.cursorrules`, `GEMINI.md` — each tool has its own format
- **Big companies want to lock you in** — Google imports INTO Gemini, Anthropic imports INTO Claude, but nobody helps you take your persona OUT
- **One file should be enough** — define your AI's personality, rules, and preferences once in `aisona.yml`, export to every tool

## How?

```
aisona.yml (you own this, stored in your Git)
  ├── export --to claude  → CLAUDE.md
  ├── export --to cursor  → .cursorrules
  ├── export --to gemini  → GEMINI.md
  ├── export --to copilot → copilot-instructions.md
  └── watch → auto re-export + git commit/push
```

**aisona is not a platform.** It doesn't host your data. Your persona lives in your own Git repo. Always.

## License

MIT
