import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseClaudeMd, parseCursorRules, detectTools } from '../src/lib/parser.js';

const TMP = path.join(os.tmpdir(), 'aisona-test-parser-' + Date.now());

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }));
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

describe('parseClaudeMd', () => {
  it('parses rules and habits from simple CLAUDE.md', () => {
    const content = `## Language\n\nAlways reply in Cantonese.\n\n## Rules\n\n- Never commit without asking\n- Never push to remote\n\n## Preferences\n\n- Use Playwright for testing\n- Short responses\n`;
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), content);

    const result = parseClaudeMd(path.join(TMP, 'CLAUDE.md'));
    expect(result.rules).toContain('Never commit without asking');
    expect(result.rules).toContain('Never push to remote');
    expect(result.preferences.habits).toContain('Use Playwright for testing');
  });

  it('extracts tone from personality sections', () => {
    const content = `## Tone and Style\n\nBe concise and direct.\n\n- No emojis unless asked\n- Short sentences\n`;
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), content);

    const result = parseClaudeMd(path.join(TMP, 'CLAUDE.md'));
    expect(result.preferences.tone).toContain('concise and direct');
    expect(result.preferences.habits).toContain('No emojis unless asked');
  });

  it('extracts autonomy rules', () => {
    const content = `## Autonomy\n\nWork autonomously.\n\nAlways ask before git push.\nNever ask before reading files.\n\n- Destructive actions need confirmation\n`;
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), content);

    const result = parseClaudeMd(path.join(TMP, 'CLAUDE.md'));
    expect(result.preferences.autonomy).toContain('Work autonomously');
    expect(result.rules).toContain('Always ask before git push.');
    expect(result.rules).toContain('Never ask before reading files.');
    expect(result.rules).toContain('Destructive actions need confirmation');
  });

  it('extracts teaching preferences', () => {
    const content = `## Teaching Style\n\nThe user is a junior developer.\n\n- Frame lessons as reusable mental models\n- Never skip teaching\n`;
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), content);

    const result = parseClaudeMd(path.join(TMP, 'CLAUDE.md'));
    expect(result.preferences.teaching).toContain('junior developer');
    expect(result.preferences.habits).toContain('Frame lessons as reusable mental models');
  });

  it('handles empty CLAUDE.md', () => {
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), '');

    const result = parseClaudeMd(path.join(TMP, 'CLAUDE.md'));
    expect(result.rules).toEqual([]);
    expect(result.preferences.habits).toEqual([]);
  });

  it('handles Nicole real-world structure', () => {
    const content = `## Language\n\nAlways reply in Cantonese.\n\n## Technical Explanations\n\nExplain step by step.\n\n- Show where data comes from\n- Name actual tables\n\n## Teaching Style\n\nThe user is a junior developer.\n\n- End tasks with learning section\n\n## Autonomy\n\nWork autonomously.\n\nAlways ask before committing.\nNever ask before reading files.\n\n- Destructive actions: deleting files\n- Actions visible to others: pushing\n\n## Project Knowledge Capture\n\n- Flag reusable discoveries\n`;
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), content);

    const result = parseClaudeMd(path.join(TMP, 'CLAUDE.md'));
    expect(result.rules.length).toBeGreaterThanOrEqual(4);
    expect(result.preferences.teaching).toContain('junior developer');
    expect(result.preferences.habits.some(h => h.includes('data comes from'))).toBe(true);
    expect(result.memories.length).toBeGreaterThanOrEqual(1);
  });
});

describe('parseCursorRules', () => {
  it('extracts rules from .cursorrules', () => {
    const content = `# Rules\n\n- Always use TypeScript\n- Prefer functional style\n\nUse concise names.\n`;
    fs.writeFileSync(path.join(TMP, '.cursorrules'), content);

    const result = parseCursorRules(path.join(TMP, '.cursorrules'));
    expect(result.rules).toContain('Always use TypeScript');
    expect(result.context).toContain('concise names');
  });
});

describe('detectTools', () => {
  it('detects CLAUDE.md in project directory', () => {
    fs.writeFileSync(path.join(TMP, 'CLAUDE.md'), '# Test');
    const detected = detectTools(TMP);
    expect(detected.find(d => d.tool === 'claude' && d.scope === 'project')).toBeDefined();
  });

  it('detects .cursorrules', () => {
    fs.writeFileSync(path.join(TMP, '.cursorrules'), '# Test');
    expect(detectTools(TMP).find(d => d.tool === 'cursor')).toBeDefined();
  });

  it('detects copilot instructions', () => {
    fs.mkdirSync(path.join(TMP, '.github'), { recursive: true });
    fs.writeFileSync(path.join(TMP, '.github', 'copilot-instructions.md'), '# Test');
    expect(detectTools(TMP).find(d => d.tool === 'copilot')).toBeDefined();
  });

  it('detects AGENTS.md', () => {
    fs.writeFileSync(path.join(TMP, 'AGENTS.md'), '# Test');
    expect(detectTools(TMP).find(d => d.tool === 'agentsmd')).toBeDefined();
  });

  it('returns empty for empty directory (project-level)', () => {
    const projectLevel = detectTools(TMP).filter(d => d.scope === 'project');
    expect(projectLevel).toEqual([]);
  });
});
