import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadAisona, saveAisona, getDefaultAisona, findAisonaFile } from '../src/lib/config.js';

const TMP = path.join(os.tmpdir(), 'aisona-test-config-' + Date.now());

beforeEach(() => fs.mkdirSync(TMP, { recursive: true }));
afterEach(() => fs.rmSync(TMP, { recursive: true, force: true }));

describe('getDefaultAisona', () => {
  it('returns valid structure with all required fields', () => {
    const def = getDefaultAisona();
    expect(def.version).toBe(1);
    expect(def.identity).toBeDefined();
    expect(def.identity.name).toBe('');
    expect(def.preferences).toBeDefined();
    expect(def.preferences.tone).toBe('');
    expect(def.preferences.habits).toEqual([]);
    expect(def.rules).toEqual([]);
    expect(def.memories).toEqual([]);
    expect(def.tools.claude.enabled).toBe(true);
    expect(def.tools.cursor.enabled).toBe(true);
    expect(def.tools.gemini.enabled).toBe(false);
  });
});

describe('saveAisona + loadAisona roundtrip', () => {
  it('saves and loads YAML correctly', () => {
    const data = getDefaultAisona();
    data.identity.name = 'Test User';
    data.identity.language = 'Cantonese';
    data.rules = ['Never commit without asking', 'Use feature branches'];
    data.preferences.tone = 'Direct and concise';
    data.memories = ['User prefers short responses'];

    const filePath = path.join(TMP, 'aisona.yml');
    saveAisona(filePath, data);

    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = loadAisona(filePath);
    expect(loaded.identity.name).toBe('Test User');
    expect(loaded.identity.language).toBe('Cantonese');
    expect(loaded.rules).toEqual(['Never commit without asking', 'Use feature branches']);
    expect(loaded.preferences.tone).toBe('Direct and concise');
    expect(loaded.memories).toEqual(['User prefers short responses']);
  });

  it('preserves tool config through roundtrip', () => {
    const data = getDefaultAisona();
    data.tools.claude.extra = ['Explain like a debugger'];
    data.tools.cursor.enabled = false;

    const filePath = path.join(TMP, 'aisona.yml');
    saveAisona(filePath, data);
    const loaded = loadAisona(filePath);

    expect(loaded.tools.claude.extra).toEqual(['Explain like a debugger']);
    expect(loaded.tools.cursor.enabled).toBe(false);
  });
});

describe('findAisonaFile', () => {
  it('finds aisona.yml in the given directory', () => {
    const filePath = path.join(TMP, 'aisona.yml');
    fs.writeFileSync(filePath, 'version: 1\n');

    const found = findAisonaFile(TMP);
    expect(found).toBe(filePath);
  });

  it('returns null when no aisona.yml exists', () => {
    const found = findAisonaFile(TMP);
    expect(found).toBeNull();
  });
});
