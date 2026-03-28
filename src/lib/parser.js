/**
 * Parse existing AI tool configs into aisona.yml structure.
 * This is the "import" logic — reads CLAUDE.md, .cursorrules, etc.
 * and extracts personality, rules, and preferences.
 */

import fs from 'fs';
import path from 'path';

/**
 * Parse a CLAUDE.md file into structured sections.
 * CLAUDE.md is free-form markdown, so we use heuristics:
 * - H2 headers (##) = section boundaries
 * - Bullet points = rules/preferences
 * - Prose = personality/context
 */
export function parseClaudeMd(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const result = {
    personality: { tone: '', style: [], teaching: '', autonomy: '' },
    rules: [],
    preferences: [],
    memories: [],
    raw_sections: {},
  };

  let currentSection = '_preamble';

  for (const line of lines) {
    // Detect H2 headers
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      currentSection = h2Match[1].trim().toLowerCase();
      result.raw_sections[currentSection] = [];
      continue;
    }

    if (!result.raw_sections[currentSection]) {
      result.raw_sections[currentSection] = [];
    }
    result.raw_sections[currentSection].push(line);
  }

  // Extract rules from common section names
  const rulesSections = ['rules', 'autonomy', 'constraints', 'boundaries', 'hard rules'];
  const prefsSections = ['preferences', 'style', 'code style', 'coding style', 'conventions'];
  const personalitySections = ['language', 'tone', 'communication', 'personality', 'tone and style'];
  const teachingSections = ['teaching', 'teaching style', 'learning', 'explanations', 'technical explanations'];
  const memorySections = ['memory', 'memories', 'learned', 'context', 'project knowledge capture'];

  for (const [section, lines] of Object.entries(result.raw_sections)) {
    const bullets = lines
      .filter(l => l.match(/^[-*]\s+/))
      .map(l => l.replace(/^[-*]\s+/, '').trim())
      .filter(l => l.length > 0);

    const prose = lines
      .filter(l => !l.match(/^[-*]\s+/) && !l.match(/^#/) && l.trim().length > 0)
      .map(l => l.trim())
      .join(' ')
      .trim();

    // Order matters: check more specific sections first to avoid false matches
    // e.g., "teaching style" should match teaching, not style/preferences
    if (teachingSections.some(s => section.includes(s))) {
      if (prose) result.personality.teaching = prose;
      result.preferences.push(...bullets);
    } else if (personalitySections.some(s => section.includes(s))) {
      if (prose) result.personality.tone = prose;
      result.personality.style.push(...bullets);
    } else if (rulesSections.some(s => section.includes(s))) {
      result.rules.push(...bullets);
      if (prose && section.includes('autonomy')) {
        result.personality.autonomy = prose;
      }
    } else if (prefsSections.some(s => section.includes(s))) {
      result.preferences.push(...bullets);
      if (bullets.length > 0 && !result.personality.tone) {
        result.personality.style.push(...bullets);
      }
      result.preferences.push(...bullets);
    } else if (memorySections.some(s => section.includes(s))) {
      result.memories.push(...bullets);
    } else {
      // Unknown sections — add bullets as preferences
      if (bullets.length > 0) {
        result.preferences.push(...bullets);
      }
    }
  }

  return result;
}

/**
 * Parse .cursorrules (simple markdown, usually just rules)
 */
export function parseCursorRules(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const rules = lines
    .filter(l => l.match(/^[-*]\s+/))
    .map(l => l.replace(/^[-*]\s+/, '').trim())
    .filter(l => l.length > 0);

  // Non-bullet lines = prose context
  const prose = lines
    .filter(l => !l.match(/^[-*]\s+/) && !l.match(/^#/) && l.trim().length > 0)
    .map(l => l.trim())
    .join(' ')
    .trim();

  return { rules, context: prose };
}

/**
 * Parse GEMINI.md (same format as CLAUDE.md essentially)
 */
export function parseGeminiMd(filePath) {
  return parseClaudeMd(filePath); // Same markdown format
}

/**
 * Detect which AI tool configs exist in a directory
 */
export function detectTools(dir) {
  const home = process.env.HOME;
  const detected = [];

  // Claude Code
  const claudePaths = [
    path.join(home, '.claude', 'CLAUDE.md'),
    path.join(dir, 'CLAUDE.md'),
  ];
  for (const p of claudePaths) {
    if (fs.existsSync(p)) {
      detected.push({ tool: 'claude', path: p, scope: p.includes(home + '/.claude') ? 'global' : 'project' });
    }
  }

  // Cursor
  const cursorPaths = [
    path.join(dir, '.cursorrules'),
    path.join(dir, '.cursor', 'rules'),
  ];
  for (const p of cursorPaths) {
    if (fs.existsSync(p)) {
      detected.push({ tool: 'cursor', path: p, scope: 'project' });
    }
  }

  // Gemini
  const geminiPaths = [
    path.join(home, '.gemini', 'GEMINI.md'),
    path.join(dir, 'GEMINI.md'),
  ];
  for (const p of geminiPaths) {
    if (fs.existsSync(p)) {
      detected.push({ tool: 'gemini', path: p, scope: p.includes(home + '/.gemini') ? 'global' : 'project' });
    }
  }

  // Copilot
  const copilotPath = path.join(dir, '.github', 'copilot-instructions.md');
  if (fs.existsSync(copilotPath)) {
    detected.push({ tool: 'copilot', path: copilotPath, scope: 'project' });
  }

  // Windsurf
  const windsurfPath = path.join(dir, '.windsurfrules');
  if (fs.existsSync(windsurfPath)) {
    detected.push({ tool: 'windsurf', path: windsurfPath, scope: 'project' });
  }

  // AGENTS.md
  const agentsPath = path.join(dir, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    detected.push({ tool: 'agentsmd', path: agentsPath, scope: 'project' });
  }

  return detected;
}
