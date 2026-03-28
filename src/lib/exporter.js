import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Map tool id → output file path (relative to project root or home)
const TOOL_OUTPUTS = {
  claude: { file: 'CLAUDE.md', globalFile: '.claude/CLAUDE.md' },
  cursor: { file: '.cursorrules' },
  gemini: { file: 'GEMINI.md', globalFile: '.gemini/GEMINI.md' },
  copilot: { file: '.github/copilot-instructions.md' },
  windsurf: { file: '.windsurfrules' },
};

function loadTemplate(toolId) {
  const templatePath = path.join(TEMPLATES_DIR, `${toolId}.hbs`);
  if (!fs.existsSync(templatePath)) {
    return null;
  }
  const raw = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(raw, { noEscape: true });
}

/**
 * Clean up template output — remove excessive blank lines
 */
function cleanOutput(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')  // max 2 consecutive newlines
    .trim() + '\n';
}

/**
 * Export aisona data to a specific tool's config file
 */
export function exportToTool(aisona, toolId, dir) {
  const template = loadTemplate(toolId);
  if (!template) {
    return { success: false, error: `No template found for tool: ${toolId}` };
  }

  const toolConfig = aisona.tools?.[toolId];
  if (toolConfig && toolConfig.enabled === false) {
    return { success: false, error: `Tool ${toolId} is disabled in aisona.yml` };
  }

  const output = cleanOutput(template(aisona));

  const toolOutput = TOOL_OUTPUTS[toolId];
  if (!toolOutput) {
    return { success: false, error: `Unknown output path for tool: ${toolId}` };
  }

  const outPath = path.join(dir, toolOutput.file);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output, 'utf8');

  return { success: true, path: outPath, tool: toolId };
}

/**
 * Export to all enabled tools
 */
export function exportToAll(aisona, dir) {
  const results = [];

  for (const [toolId, config] of Object.entries(aisona.tools || {})) {
    if (config.enabled === false) continue;
    if (!TOOL_OUTPUTS[toolId]) continue;

    const result = exportToTool(aisona, toolId, dir);
    results.push(result);
  }

  return results;
}

/**
 * Get list of supported tools
 */
export function getSupportedTools() {
  return Object.keys(TOOL_OUTPUTS);
}
