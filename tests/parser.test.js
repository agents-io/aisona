import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseClaudeMd, parseCursorRules, detectTools } from '../src/lib/parser.js';

const TMP = path.join(os.tmpdir(), 'aisona-test-parser-' + Date.now());

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }));
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

describe('parseClaudeMd', () => {
  it('parses a simple CLAUDE.md with rules and preferences', () => {
    const content = `## Language

Always reply in Cantonese.

## Rules

- Never commit without asking
- Never push to remote without asking

## Preferences

- Use Playwright for testing
- Short responses preferred
`;
    const filePath = path.join(TMP, 'CLAUDE.md');
    fs.writeFileSync(filePath, content);

    const result = parseClaudeMd(filePath);
    expect(result.rules).toContain('Never commit without asking');
    expect(result.rules).toContain('Never push to remote without asking');
    expect(result.preferences).toContain('Use Playwright for testing');
  });

  it('extracts personality from tone/style sections', () => {
    const content = `## Tone and Style

Be concise and direct.

- No emojis unless asked
- Short sentences
`;
    const filePath = path.join(TMP, 'CLAUDE.md');
    fs.writeFileSync(filePath, content);

    const result = parseClaudeMd(filePath);
    expect(result.personality.tone).toContain('concise and direct');
    expect(result.personality.style).toContain('No emojis unless asked');
  });

  it('extracts autonomy from autonomy section', () => {
    const content = `## Autonomy

Work autonomously. Only ask before destructive actions.

- Never ask before reading files
- Always ask before git push
`;
    const filePath = path.join(TMP, 'CLAUDE.md');
    fs.writeFileSync(filePath, content);

    const result = parseClaudeMd(filePath);
    expect(result.personality.autonomy).toContain('Work autonomously');
    expect(result.rules).toContain('Never ask before reading files');
  });

  it('extracts teaching style', () => {
    const content = `## Teaching Style

Explain like a senior engineer. Always include a learning section after tasks.

- Frame lessons as reusable mental models
- Never skip teaching even for simple tasks
`;
    const filePath = path.join(TMP, 'CLAUDE.md');
    fs.writeFileSync(filePath, content);

    const result = parseClaudeMd(filePath);
    expect(result.personality.teaching).toContain('senior engineer');
    expect(result.preferences).toContain('Frame lessons as reusable mental models');
  });

  it('handles Nicole real-world CLAUDE.md structure', () => {
    // Simulates the structure of the actual ~/.claude/CLAUDE.md
    const content = `## Language

Always reply in Cantonese (廣東話) unless the user writes in another language or explicitly asks for English.

## Technical Explanations

When explaining code, explain it so the user can clearly picture what the computer is doing.

- Show where data comes from and where it goes
- Name the actual tables, functions, fields involved
- Do not skip the hidden middle steps

## Teaching Style

The user is a junior developer (~11 months experience).

- End every completed task with a learning section
- Talk like a helpful senior engineer

## Autonomy

Work autonomously. Only ask for confirmation before:
- Destructive actions: deleting files, dropping DB tables
- Actions visible to others: pushing to remote, opening PRs

## Project Knowledge Capture

When working on projects, if you discover something reusable, mention it.

- Check project docs before suggesting changes
`;
    const filePath = path.join(TMP, 'CLAUDE.md');
    fs.writeFileSync(filePath, content);

    const result = parseClaudeMd(filePath);

    // Should extract rules from autonomy
    expect(result.rules.length).toBeGreaterThan(0);

    // Should extract teaching
    expect(result.personality.teaching).toContain('junior developer');

    // Should extract style from technical explanations
    expect(result.preferences.some(p => p.includes('data comes from'))).toBe(true);
  });

  it('handles empty CLAUDE.md', () => {
    const filePath = path.join(TMP, 'CLAUDE.md');
    fs.writeFileSync(filePath, '');

    const result = parseClaudeMd(filePath);
    expect(result.rules).toEqual([]);
    expect(result.preferences).toEqual([]);
  });
});

describe('parseCursorRules', () => {
  it('extracts rules from .cursorrules', () => {
    const content = `# Coding Rules

- Always use TypeScript
- Prefer functional style
- No classes unless necessary

Use concise variable names.
`;
    const filePath = path.join(TMP, '.cursorrules');
    fs.writeFileSync(filePath, content);

    const result = parseCursorRules(filePath);
    expect(result.rules).toContain('Always use TypeScript');
    expect(result.rules).toContain('Prefer functional style');
    expect(result.context).toContain('concise variable names');
  });
});

describe('detectTools', () => {
  it('detects CLAUDE.md in project directory', () => {
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), '# Test');

    const detected = detectTools(TMP);
    const claude = detected.find(d => d.tool === 'claude' && d.scope === 'project');
    expect(claude).toBeDefined();
  });

  it('detects .cursorrules', () => {
    fs.writeFileSync(path.join(TMP, '.cursorrules'), '# Test');

    const detected = detectTools(TMP);
    const cursor = detected.find(d => d.tool === 'cursor');
    expect(cursor).toBeDefined();
  });

  it('detects copilot instructions', () => {
    fs.mkdirSync(path.join(TMP, '.github'), { recursive: true });
    fs.writeFileSync(path.join(TMP, '.github', 'copilot-instructions.md'), '# Test');

    const detected = detectTools(TMP);
    const copilot = detected.find(d => d.tool === 'copilot');
    expect(copilot).toBeDefined();
  });

  it('detects AGENTS.md', () => {
    fs.writeFileSync(path.join(TMP, 'AGENTS.md'), '# Test');

    const detected = detectTools(TMP);
    const agents = detected.find(d => d.tool === 'agentsmd');
    expect(agents).toBeDefined();
  });

  it('returns empty array for empty directory', () => {
    const detected = detectTools(TMP);
    // May detect global configs from ~/.claude etc, but no project-level
    const projectLevel = detected.filter(d => d.scope === 'project');
    expect(projectLevel).toEqual([]);
  });
});
