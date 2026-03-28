# aisona.yml Format Specification v1

> The portable AI persona format. Define your AI's personality once, deploy everywhere.

## Overview

`aisona.yml` is a structured YAML file that defines an AI assistant's persona — personality, communication style, rules, preferences, and memories — in a tool-agnostic format that can be exported to any AI coding tool.

## Schema

```yaml
# aisona.yml v1
version: 1

# === IDENTITY ===
# Who the user is (so the AI knows who it's talking to)
identity:
  name: ""                    # User's name or alias
  role: ""                    # Professional role/context
  experience: ""              # Level of experience (helps AI calibrate explanations)
  context: ""                 # Current work context
  language: ""                # Preferred response language (e.g., "Cantonese", "English")

# === PERSONALITY ===
# How the AI should behave and communicate
personality:
  tone: ""                    # Overall communication tone
  verbosity: ""               # "concise" | "balanced" | "detailed"
  style: []                   # List of style directives
  teaching: ""                # How to teach/explain (if applicable)
  autonomy: ""                # How autonomous the AI should be

# === RULES ===
# Hard rules the AI must follow
rules: []                     # List of rule strings

# === PREFERENCES ===
# Soft preferences (nice-to-have, not hard rules)
preferences: []               # List of preference strings

# === MEMORIES ===
# Learned facts and preferences from past interactions
memories: []                  # List of memory strings

# === TOOLS ===
# Per-tool overrides and extra configuration
tools:
  claude:
    enabled: true
    extra_rules: []           # Rules only for Claude
    extra_context: ""         # Additional context for Claude
  cursor:
    enabled: true
    extra_rules: []
  gemini:
    enabled: true
    extra_rules: []
  copilot:
    enabled: true
    extra_rules: []
  windsurf:
    enabled: false
    extra_rules: []
  aider:
    enabled: false
    extra_rules: []
  openrouter:
    enabled: false
    system_prompt_append: ""  # Appended to system prompt
```

## Field Definitions

### identity (required)

Tells the AI who it's working with. Helps calibrate tone, explanations, and assumptions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | User's name or preferred alias |
| `role` | string | yes | What the user does (e.g., "Backend engineer") |
| `experience` | string | no | Experience level (e.g., "11 months", "senior", "student") |
| `context` | string | no | Current work context |
| `language` | string | no | Preferred language for responses |

### personality (required)

Defines how the AI communicates. This is what makes your AI feel like "yours."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tone` | string | yes | Overall tone (e.g., "Direct and concise, like a senior engineer") |
| `verbosity` | string | no | How verbose responses should be |
| `style` | string[] | no | Specific style directives |
| `teaching` | string | no | How to explain things |
| `autonomy` | string | no | How much to ask vs. just do |

### rules (required)

Hard constraints. The AI must follow these. Violations are bugs.

Type: `string[]`

Example:
```yaml
rules:
  - "Never commit without asking"
  - "Never include company names in public repos"
  - "Use feature branches for big changes"
```

### preferences (optional)

Soft preferences. The AI should try to follow these but they're not hard rules.

Type: `string[]`

### memories (optional)

Facts learned from past interactions. Manually curated.

Type: `string[]`

### tools (optional)

Per-tool configuration. Each tool key can have:

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether to export to this tool |
| `extra_rules` | string[] | Rules that only apply to this tool |
| `extra_context` | string | Additional context for this tool |

## Export Targets

| Tool | Output File | Location |
|------|------------|----------|
| Claude Code | `CLAUDE.md` | Project root or `~/.claude/` |
| Cursor | `.cursorrules` or `.cursor/rules/*.mdc` | Project root |
| Gemini CLI | `GEMINI.md` | Project root or `~/.gemini/` |
| GitHub Copilot | `.github/copilot-instructions.md` | Project root |
| Windsurf | `.windsurfrules` | Project root |
| Aider | `.aider.conf.yml` | Project root |
| OpenRouter | System prompt text | API config |
| AGENTS.md | `AGENTS.md` | Project root |

## Design Principles

1. **Human-readable** — YAML, not JSON. Easy to edit by hand.
2. **Tool-agnostic** — No tool-specific concepts in the core schema.
3. **Personality-first** — Identity and personality are required. Rules are secondary.
4. **User-owned** — Stored in user's own Git. No platform dependency.
5. **Backwards-compatible** — New fields are always optional. v1 files work with v2+ tools.
6. **Exportable** — Every field maps to at least one export target.

## Versioning

The `version` field indicates the schema version. The CLI will warn if the file uses a newer version than supported.

## Prior Art

- SOUL.md — Personality-focused but free-form markdown, no schema, no export
- AGENTS.md — Coding rules standard, no personality/memory
- rulesync — Structured rules with export to 27+ tools, no personality
- Character Card V3 — JSON schema for roleplay, not coding
- CrewAI — role/goal/backstory YAML, too minimal

aisona.yml combines the personality focus of SOUL.md with the structured exportability of rulesync.
