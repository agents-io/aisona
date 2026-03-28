import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exportToTool, exportToAll, getSupportedTools } from '../src/lib/exporter.js';

const TMP = path.join(os.tmpdir(), 'aisona-test-export-' + Date.now());

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }));
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

const SAMPLE_AISONA = {
  version: 1,
  identity: {
    name: 'TestUser',
    role: 'Backend engineer',
    experience: '11 months',
    context: 'AI security',
    language: 'Cantonese (廣東話)',
  },
  personality: {
    tone: 'Direct and concise',
    verbosity: 'concise',
    style: ['No emojis', 'Short sentences'],
    teaching: 'Explain like a senior engineer',
    autonomy: 'Work autonomously',
  },
  rules: ['Never commit without asking', 'Use feature branches'],
  preferences: ['Use Playwright for testing'],
  memories: ['User prefers Cantonese'],
  tools: {
    claude: { enabled: true, extra_rules: ['End tasks with learning section'] },
    cursor: { enabled: true, extra_rules: ['Use .mdc format'] },
    gemini: { enabled: true, extra_rules: [] },
    copilot: { enabled: true, extra_rules: [] },
    windsurf: { enabled: false, extra_rules: [] },
  },
};

describe('getSupportedTools', () => {
  it('returns list of supported tool ids', () => {
    const tools = getSupportedTools();
    expect(tools).toContain('claude');
    expect(tools).toContain('cursor');
    expect(tools).toContain('gemini');
    expect(tools).toContain('copilot');
    expect(tools).toContain('windsurf');
  });
});

describe('exportToTool — Claude', () => {
  it('generates valid CLAUDE.md', () => {
    const result = exportToTool(SAMPLE_AISONA, 'claude', TMP);

    expect(result.success).toBe(true);
    expect(result.tool).toBe('claude');

    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('Cantonese (廣東話)');
    expect(content).toContain('Direct and concise');
    expect(content).toContain('No emojis');
    expect(content).toContain('Never commit without asking');
    expect(content).toContain('Use Playwright for testing');
    expect(content).toContain('User prefers Cantonese');
    expect(content).toContain('End tasks with learning section');
  });

  it('includes all sections with correct headers', () => {
    const result = exportToTool(SAMPLE_AISONA, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');

    expect(content).toContain('## Language');
    expect(content).toContain('## Tone and Style');
    expect(content).toContain('## Teaching Style');
    expect(content).toContain('## Autonomy');
    expect(content).toContain('## Rules');
    expect(content).toContain('## Preferences');
    expect(content).toContain('## Context');
    expect(content).toContain('## Claude-Specific');
  });

  it('writes to CLAUDE.md', () => {
    exportToTool(SAMPLE_AISONA, 'claude', TMP);
    expect(fs.existsSync(path.join(TMP, 'CLAUDE.md'))).toBe(true);
  });
});

describe('exportToTool — Cursor', () => {
  it('generates valid .cursorrules', () => {
    const result = exportToTool(SAMPLE_AISONA, 'cursor', TMP);

    expect(result.success).toBe(true);
    const content = fs.readFileSync(result.path, 'utf8');

    expect(content).toContain('Backend engineer');
    expect(content).toContain('Cantonese');
    expect(content).toContain('Never commit without asking');
    expect(content).toContain('Use .mdc format');
  });

  it('writes to .cursorrules', () => {
    exportToTool(SAMPLE_AISONA, 'cursor', TMP);
    expect(fs.existsSync(path.join(TMP, '.cursorrules'))).toBe(true);
  });
});

describe('exportToTool — Gemini', () => {
  it('generates valid GEMINI.md', () => {
    const result = exportToTool(SAMPLE_AISONA, 'gemini', TMP);

    expect(result.success).toBe(true);
    const content = fs.readFileSync(result.path, 'utf8');

    expect(content).toContain('Cantonese');
    expect(content).toContain('Backend engineer');
    expect(content).toContain('11 months');
    expect(content).toContain('Never commit without asking');
  });

  it('writes to GEMINI.md', () => {
    exportToTool(SAMPLE_AISONA, 'gemini', TMP);
    expect(fs.existsSync(path.join(TMP, 'GEMINI.md'))).toBe(true);
  });
});

describe('exportToTool — Copilot', () => {
  it('generates valid copilot-instructions.md', () => {
    const result = exportToTool(SAMPLE_AISONA, 'copilot', TMP);

    expect(result.success).toBe(true);
    const content = fs.readFileSync(result.path, 'utf8');

    expect(content).toContain('Cantonese');
    expect(content).toContain('Never commit without asking');
  });

  it('writes to .github/copilot-instructions.md', () => {
    exportToTool(SAMPLE_AISONA, 'copilot', TMP);
    expect(fs.existsSync(path.join(TMP, '.github', 'copilot-instructions.md'))).toBe(true);
  });
});

describe('exportToTool — disabled tool', () => {
  it('refuses to export to disabled tool', () => {
    const result = exportToTool(SAMPLE_AISONA, 'windsurf', TMP);
    expect(result.success).toBe(false);
    expect(result.error).toContain('disabled');
  });
});

describe('exportToTool — unknown tool', () => {
  it('fails for unknown tool', () => {
    const result = exportToTool(SAMPLE_AISONA, 'nonexistent', TMP);
    expect(result.success).toBe(false);
  });
});

describe('exportToAll', () => {
  it('exports to all enabled tools', () => {
    const results = exportToAll(SAMPLE_AISONA, TMP);

    const succeeded = results.filter(r => r.success);
    expect(succeeded.length).toBe(4); // claude, cursor, gemini, copilot (windsurf disabled)

    expect(fs.existsSync(path.join(TMP, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, '.cursorrules'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, 'GEMINI.md'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, '.github', 'copilot-instructions.md'))).toBe(true);
    // windsurf disabled — should NOT exist
    expect(fs.existsSync(path.join(TMP, '.windsurfrules'))).toBe(false);
  });

  it('skips tools with no output config', () => {
    const aisona = {
      ...SAMPLE_AISONA,
      tools: { claude: { enabled: true, extra_rules: [] } },
    };
    const results = exportToAll(aisona, TMP);
    expect(results.length).toBe(1);
    expect(results[0].tool).toBe('claude');
  });
});

describe('export output quality', () => {
  it('does not have triple+ blank lines', () => {
    const result = exportToTool(SAMPLE_AISONA, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).not.toMatch(/\n{4,}/);
  });

  it('ends with single newline', () => {
    const result = exportToTool(SAMPLE_AISONA, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
    expect(content.endsWith('\n\n')).toBe(false);
  });

  it('contains aisona attribution comment', () => {
    // Templates should have the aisona attribution but it's in Handlebars comments
    // which don't render. Check the generated output is clean.
    const result = exportToTool(SAMPLE_AISONA, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');
    // Should NOT contain raw handlebars
    expect(content).not.toContain('{{');
    expect(content).not.toContain('}}');
  });

  it('handles empty arrays gracefully', () => {
    const minimal = {
      version: 1,
      identity: { name: 'Test', language: 'English' },
      personality: { tone: 'Friendly' },
      rules: [],
      preferences: [],
      memories: [],
      tools: { claude: { enabled: true, extra_rules: [] } },
    };

    const result = exportToTool(minimal, 'claude', TMP);
    expect(result.success).toBe(true);
    const content = fs.readFileSync(result.path, 'utf8');

    // Should have language and tone but no empty sections
    expect(content).toContain('English');
    expect(content).toContain('Friendly');
    // Should NOT have "## Rules" with nothing under it
    expect(content).not.toContain('## Rules\n\n##');
  });
});
