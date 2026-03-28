# aisona.yml Format Specification v1

> Pack your AI habits and take them anywhere. A portable format for your AI usage preferences, rules, and learned context — backed by Git, exported to any tool.

## Overview

`aisona.yml` is a structured YAML file that captures how YOU use AI tools — your language preference, your rules, your workflow habits, things your AI has learned about you. It's portable: write it once, export to Claude Code, Cursor, Gemini, Copilot, or any tool that reads config files.

Think of it like your browser bookmarks or your shell dotfiles — except for your AI.

## What It Captures

```
✅ Things worth packing:
   - "Reply in Cantonese"                    → language preference
   - "Always ask before committing"          → hard rule
   - "Use Playwright, not Chrome DevTools"   → tool preference
   - "I'm a junior dev, explain things"      → context for AI calibration
   - "bare npx corrupts nvm, use full path"  → learned lesson
   - "End tasks with a learning section"     → behavior preference

❌ Things NOT worth packing (waste of tokens):
   - Your life philosophy / worldview
   - Your personality contradictions
   - Words you'd never use
   - Your rhetorical style analysis
```

## Schema

```yaml
# aisona.yml v1
version: 1

# === WHO YOU ARE ===
# Enough context for AI to calibrate responses. Keep it short.
identity:
  name: ""                    # Your name or alias
  role: ""                    # What you do (e.g., "Backend engineer")
  experience: ""              # Level (e.g., "11 months", "senior", "student")
  language: ""                # Preferred AI response language

# === HOW YOU LIKE IT ===
# Your AI usage habits — how you want the AI to behave.
preferences:
  tone: ""                    # e.g., "Direct and concise" or "Detailed with examples"
  verbosity: ""               # "concise" | "balanced" | "detailed"
  autonomy: ""                # e.g., "Work autonomously, only ask before destructive actions"
  teaching: ""                # e.g., "Explain what changed and why after each task"
  habits: []                  # List of specific behavior preferences

# === HARD RULES ===
# Things the AI must ALWAYS or NEVER do. Violations = bugs.
rules: []

# === THINGS AI LEARNED ABOUT YOU ===
# Facts, lessons, context from past usage. Portable memory.
memories: []

# === PER-TOOL SETTINGS ===
# Tool-specific overrides. Only enable tools you actually use.
tools:
  claude:
    enabled: true
    extra: []                 # Claude-specific rules/preferences
  cursor:
    enabled: true
    extra: []
  gemini:
    enabled: false
    extra: []
  copilot:
    enabled: false
    extra: []
  windsurf:
    enabled: false
    extra: []
```

## Real Example

```yaml
version: 1

identity:
  name: Nicole
  role: Backend engineer
  experience: 11 months
  language: Cantonese (廣東話)

preferences:
  tone: Direct and concise, like a helpful senior engineer
  verbosity: concise
  autonomy: Work autonomously. Only ask before destructive actions or pushing to remote.
  teaching: End every task with a learning section — what changed, why, and one reusable concept.
  habits:
    - Show execution flow step by step, like a debugger
    - Don't skip hidden middle steps
    - Use Playwright for testing, not Chrome DevTools
    - Use full nvm path for node/npx

rules:
  - Always ask before committing or pushing
  - Never include company names in public repos
  - Use feature branches for big changes
  - Never ask before reading files, searching, or editing

memories:
  - Side projects use GitHub ithiria894, never company account
  - bare npx corrupts nvm default alias — always use full path
  - Reddit posts need narrative hook, no limitations talk
  - After every workflow run, update playbook + OVERVIEW.md

tools:
  claude:
    enabled: true
    extra:
      - Explain like stepping through a debugger
      - End tasks with 7-point learning section
  cursor:
    enabled: true
    extra: []
```

## Field Definitions

### identity

Minimum context so AI knows who it's talking to. Keep it short — every word costs tokens.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Your name or alias |
| `role` | string | no | What you do |
| `experience` | string | no | Helps AI calibrate explanation depth |
| `language` | string | no | Preferred response language |

### preferences

How you like your AI to behave. These are soft — AI should follow but they're not hard rules.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tone` | string | no | Communication style |
| `verbosity` | string | no | concise / balanced / detailed |
| `autonomy` | string | no | When to ask vs just do |
| `teaching` | string | no | How to explain things |
| `habits` | string[] | no | Specific behavior preferences |

### rules

Hard constraints. AI must follow these. Breaking them = bug.

Type: `string[]`

Keep rules **actionable and specific**. "Never commit without asking" is good. "Be ethical" is useless.

### memories

Things your AI learned about you from past interactions. Portable context.

Type: `string[]`

These are facts and lessons, not feelings. "User's npm org is ithiria" is good. "User seems frustrated today" is not.

### tools

Per-tool overrides. Each key maps to a supported export target.

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether to export to this tool |
| `extra` | string[] | Additional rules/preferences for this tool only |

## Export Targets

| Tool | Output File | Location |
|------|------------|----------|
| Claude Code | `CLAUDE.md` | Project root or `~/.claude/` |
| Cursor | `.cursorrules` | Project root |
| Gemini CLI | `GEMINI.md` | Project root or `~/.gemini/` |
| GitHub Copilot | `.github/copilot-instructions.md` | Project root |
| Windsurf | `.windsurfrules` | Project root |
| AGENTS.md | `AGENTS.md` | Project root |

## Design Principles

1. **Practical, not philosophical** — Capture habits and preferences, not worldview and soul
2. **Token-efficient** — Every field should be worth the tokens it costs in the AI's context window
3. **Human-readable** — YAML, not JSON. Easy to edit by hand
4. **User-owned** — Stored in your own Git repo. No platform dependency
5. **Tool-agnostic** — Core schema has no tool-specific concepts
6. **Backwards-compatible** — New fields always optional. v1 files work with v2+ tools
7. **Git as protocol** — aisona.yml lives in Git. Version history, branching, sharing all come free

## How It Works

```
1. aisona init          → Scans your existing CLAUDE.md → generates aisona.yml
2. Edit aisona.yml      → Tweak your preferences, add rules, curate memories
3. aisona export --all  → Generates CLAUDE.md + .cursorrules + GEMINI.md + ...
4. aisona watch --git   → Auto re-export on change + git commit/push
5. New machine:
   git clone your-repo
   aisona export --all  → All your AI tools instantly know you again
```

## Prior Art

| Tool | What it does | What aisona adds |
|------|-------------|-----------------|
| SOUL.md | AI personality templates (fill-in-the-blank) | Structured schema + CLI + auto-export + git sync |
| personas.sh | Download pre-made AI personas (marketplace) | Pack YOUR OWN habits, not someone else's |
| PersonaSpec | JSON format for portable identity (API-first) | YAML (human-editable) + CLI + local-first + developer-focused |
| rulesync | Sync coding rules across 27+ tools | Also captures preferences, memories, teaching style — not just rules |
| memoir | Push/restore AI tool config files | Format-first (aisona.yml as source of truth, not raw file copying) |

aisona = **your AI habits, packed in a YAML, exported everywhere, synced via Git.**
