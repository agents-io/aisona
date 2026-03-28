import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exportToTool, exportToAll, getSupportedTools } from '../src/lib/exporter.js';

const TMP = path.join(os.tmpdir(), 'aisona-test-export-' + Date.now());

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }));
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

const SAMPLE = {
  version: 1,
  identity: {
    name: 'TestUser',
    role: 'Backend engineer',
    experience: '11 months',
    language: 'Cantonese (廣東話)',
  },
  preferences: {
    tone: 'Direct and concise',
    verbosity: 'concise',
    autonomy: 'Work autonomously',
    teaching: 'Explain like a senior engineer',
    habits: ['No emojis', 'Short sentences'],
  },
  rules: ['Never commit without asking', 'Use feature branches'],
  memories: ['User prefers Cantonese'],
  tools: {
    claude: { enabled: true, extra: ['End tasks with learning section'] },
    cursor: { enabled: true, extra: ['Use .mdc format'] },
    gemini: { enabled: true, extra: [] },
    copilot: { enabled: true, extra: [] },
    windsurf: { enabled: false, extra: [] },
  },
};

describe('getSupportedTools', () => {
  it('returns supported tool ids', () => {
    const tools = getSupportedTools();
    expect(tools).toContain('claude');
    expect(tools).toContain('cursor');
    expect(tools).toContain('gemini');
    expect(tools).toContain('copilot');
    expect(tools).toContain('windsurf');
  });
});

describe('exportToTool — Claude', () => {
  it('generates valid CLAUDE.md with all sections', () => {
    const result = exportToTool(SAMPLE, 'claude', TMP);
    expect(result.success).toBe(true);

    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('Cantonese (廣東話)');
    expect(content).toContain('Direct and concise');
    expect(content).toContain('No emojis');
    expect(content).toContain('Never commit without asking');
    expect(content).toContain('User prefers Cantonese');
    expect(content).toContain('End tasks with learning section');
    expect(content).toContain('## Language');
    expect(content).toContain('## Rules');
    expect(content).toContain('## Claude-Specific');
  });

  it('writes to CLAUDE.md', () => {
    exportToTool(SAMPLE, 'claude', TMP);
    expect(fs.existsSync(path.join(TMP, 'CLAUDE.md'))).toBe(true);
  });
});

describe('exportToTool — Cursor', () => {
  it('generates valid .cursorrules', () => {
    const result = exportToTool(SAMPLE, 'cursor', TMP);
    expect(result.success).toBe(true);

    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('Backend engineer');
    expect(content).toContain('Cantonese');
    expect(content).toContain('Never commit without asking');
    expect(content).toContain('Use .mdc format');
  });
});

describe('exportToTool — Gemini', () => {
  it('generates valid GEMINI.md', () => {
    const result = exportToTool(SAMPLE, 'gemini', TMP);
    expect(result.success).toBe(true);

    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('Cantonese');
    expect(content).toContain('Backend engineer');
    expect(content).toContain('11 months');
  });
});

describe('exportToTool — Copilot', () => {
  it('generates copilot-instructions.md', () => {
    const result = exportToTool(SAMPLE, 'copilot', TMP);
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(TMP, '.github', 'copilot-instructions.md'))).toBe(true);
  });
});

describe('exportToTool — disabled', () => {
  it('refuses to export disabled tool', () => {
    const result = exportToTool(SAMPLE, 'windsurf', TMP);
    expect(result.success).toBe(false);
    expect(result.error).toContain('disabled');
  });
});

describe('exportToAll', () => {
  it('exports to all enabled tools', () => {
    const results = exportToAll(SAMPLE, TMP);
    const succeeded = results.filter(r => r.success);
    expect(succeeded.length).toBe(4);

    expect(fs.existsSync(path.join(TMP, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, '.cursorrules'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, 'GEMINI.md'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, '.github', 'copilot-instructions.md'))).toBe(true);
    expect(fs.existsSync(path.join(TMP, '.windsurfrules'))).toBe(false);
  });
});

describe('output quality', () => {
  it('no triple blank lines', () => {
    const result = exportToTool(SAMPLE, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).not.toMatch(/\n{4,}/);
  });

  it('ends with single newline', () => {
    const result = exportToTool(SAMPLE, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
    expect(content.endsWith('\n\n')).toBe(false);
  });

  it('no raw handlebars in output', () => {
    const result = exportToTool(SAMPLE, 'claude', TMP);
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).not.toContain('{{');
  });

  it('handles empty arrays gracefully', () => {
    const minimal = {
      version: 1,
      identity: { name: 'Test', language: 'English' },
      preferences: { tone: 'Friendly', habits: [] },
      rules: [],
      memories: [],
      tools: { claude: { enabled: true, extra: [] } },
    };

    const result = exportToTool(minimal, 'claude', TMP);
    expect(result.success).toBe(true);
    const content = fs.readFileSync(result.path, 'utf8');
    expect(content).toContain('English');
    expect(content).toContain('Friendly');
  });
});
