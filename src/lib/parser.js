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
 * - H2/H3 headers = section boundaries
 * - Bullet points (- or *) = extractable items
 * - Numbered lists (1. 2. 3.) = extractable items
 * - Prose paragraphs = context/description
 */
export function parseClaudeMd(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const result = {
    preferences: { tone: '', habits: [], teaching: '', autonomy: '' },
    rules: [],
    memories: [],
    raw_sections: {},
  };

  let currentSection = '_preamble';

  for (const line of lines) {
    // Detect H2 or H3 headers as section boundaries
    const headerMatch = line.match(/^#{2,3}\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].trim().toLowerCase();
      if (!result.raw_sections[currentSection]) {
        result.raw_sections[currentSection] = [];
      }
      continue;
    }

    if (!result.raw_sections[currentSection]) {
      result.raw_sections[currentSection] = [];
    }
    result.raw_sections[currentSection].push(line);
  }

  // Section classification — ordered by specificity (most specific first)
  const sectionMap = [
    { keywords: ['teaching style', 'teaching angle'], category: 'teaching' },
    { keywords: ['technical explanations', 'explanations'], category: 'teaching' },
    { keywords: ['language'], category: 'language' },
    { keywords: ['tone and style', 'tone', 'communication', 'personality'], category: 'personality' },
    { keywords: ['autonomy'], category: 'autonomy' },
    { keywords: ['rules', 'constraints', 'boundaries', 'hard rules'], category: 'rules' },
    { keywords: ['style', 'code style', 'coding style', 'conventions', 'preferences'], category: 'preferences' },
    { keywords: ['memory', 'memories', 'learned', 'context', 'project knowledge'], category: 'memories' },
  ];

  function classifySection(sectionName) {
    for (const entry of sectionMap) {
      if (entry.keywords.some(k => sectionName.includes(k))) {
        return entry.category;
      }
    }
    return 'unknown';
  }

  for (const [section, sectionLines] of Object.entries(result.raw_sections)) {
    if (section === '_preamble') continue;

    const category = classifySection(section);

    // Extract bullet points (- item, * item) and numbered lists (1. item)
    const bullets = sectionLines
      .filter(l => l.match(/^\s*[-*]\s+/) || l.match(/^\s*\d+\.\s+/))
      .map(l => l.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim())
      .filter(l => l.length > 0 && !l.match(/^\*\*[^*]+\*\*$/)); // skip standalone bold headers

    // Extract prose — non-bullet, non-header, non-empty lines
    const proseLines = sectionLines
      .filter(l =>
        !l.match(/^\s*[-*]\s+/) &&
        !l.match(/^\s*\d+\.\s+/) &&
        !l.match(/^#{1,4}\s+/) &&
        !l.match(/^---\s*$/) &&
        l.trim().length > 0
      )
      .map(l => l.trim());

    // First meaningful prose line (for short descriptions)
    const firstProse = proseLines[0] || '';
    // Full prose (for longer sections)
    const fullProse = proseLines.join(' ').trim();

    switch (category) {
      case 'language':
        result.preferences.tone = firstProse || fullProse;
        result.preferences.habits.push(...bullets);
        break;

      case 'personality':
        if (fullProse) result.preferences.tone = fullProse;
        result.preferences.habits.push(...bullets);
        break;

      case 'teaching':
        // For teaching, extract first paragraph as summary, bullets as preferences
        if (firstProse) {
          // If we already have teaching, append. Otherwise set.
          result.preferences.teaching = result.preferences.teaching
            ? result.preferences.teaching + ' ' + firstProse
            : firstProse;
        }
        // Bullets from teaching sections go to preferences (they're style guides)
        result.preferences.habits.push(...bullets);
        break;

      case 'autonomy': {
        // Autonomy sections mix prose and rules. Extract both.
        // Prose lines that start with "Always" or "Never" or "Only" are rules
        const autonomyRules = proseLines.filter(l =>
          l.match(/^(Always|Never|Only|Do not|Don't)\b/i)
        );
        const autonomyProse = proseLines.filter(l =>
          !l.match(/^(Always|Never|Only|Do not|Don't)\b/i)
        ).join(' ').trim();

        if (autonomyProse) result.preferences.autonomy = autonomyProse;
        result.rules.push(...autonomyRules);
        result.rules.push(...bullets);
        break;
      }

      case 'rules':
        result.rules.push(...bullets);
        if (fullProse && !bullets.length) {
          // If rules section has prose but no bullets, treat prose as a rule
          result.rules.push(fullProse);
        }
        break;

      case 'preferences':
        result.preferences.habits.push(...bullets);
        break;

      case 'memories':
        result.memories.push(...bullets);
        if (fullProse && !bullets.length) {
          result.memories.push(fullProse);
        }
        break;

      case 'unknown':
      default:
        // Unknown sections — bullets go to preferences, prose to memories
        if (bullets.length > 0) {
          result.preferences.habits.push(...bullets);
        }
        break;
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
