import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const AISONA_FILE = 'aisona.yml';

export function findAisonaFile(dir) {
  const filePath = path.join(dir, AISONA_FILE);
  if (fs.existsSync(filePath)) return filePath;

  // Also check ~/.aisona/
  const globalPath = path.join(process.env.HOME, '.aisona', AISONA_FILE);
  if (fs.existsSync(globalPath)) return globalPath;

  return null;
}

export function loadAisona(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return yaml.load(raw);
}

export function saveAisona(filePath, data) {
  const out = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, out, 'utf8');
}

export function getDefaultAisona() {
  return {
    version: 1,
    identity: {
      name: '',
      role: '',
      experience: '',
      context: '',
      language: 'English',
    },
    personality: {
      tone: '',
      verbosity: 'balanced',
      style: [],
      teaching: '',
      autonomy: '',
    },
    rules: [],
    preferences: [],
    memories: [],
    tools: {
      claude: { enabled: true, extra_rules: [] },
      cursor: { enabled: true, extra_rules: [] },
      gemini: { enabled: false, extra_rules: [] },
      copilot: { enabled: false, extra_rules: [] },
      windsurf: { enabled: false, extra_rules: [] },
      aider: { enabled: false, extra_rules: [] },
    },
  };
}
