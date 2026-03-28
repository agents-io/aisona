import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { detectTools, parseClaudeMd, parseCursorRules } from '../lib/parser.js';
import { findAisonaFile, getDefaultAisona, saveAisona } from '../lib/config.js';

export async function initCommand(options) {
  const dir = path.resolve(options.dir || process.cwd());
  const home = process.env.HOME;

  console.log(chalk.bold('\n  aisona init\n'));
  console.log(chalk.dim('  Own your AI\'s persona. Define it once, use it everywhere.\n'));

  // Check if aisona.yml already exists
  const existing = findAisonaFile(dir);
  if (existing) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `aisona.yml already exists at ${existing}. Overwrite?`,
      default: false,
    }]);
    if (!overwrite) {
      console.log(chalk.yellow('  Aborted.'));
      return;
    }
  }

  // Detect existing AI tool configs
  console.log(chalk.blue('  Scanning for existing AI tool configs...\n'));
  const detected = detectTools(dir);

  if (detected.length === 0) {
    console.log(chalk.yellow('  No existing AI tool configs found.'));
    console.log(chalk.dim('  Creating a blank aisona.yml for you to fill in.\n'));
  } else {
    console.log(chalk.green(`  Found ${detected.length} config(s):\n`));
    for (const d of detected) {
      console.log(`    ${chalk.cyan(d.tool)} (${d.scope}) → ${chalk.dim(d.path)}`);
    }
    console.log();
  }

  // Start with default structure
  const aisona = getDefaultAisona();

  // If --from specified, import from that tool
  const importFrom = options.from;
  const claudeConfig = detected.find(d => d.tool === 'claude');

  if (importFrom === 'claude' || (!importFrom && claudeConfig)) {
    const claudePath = importFrom === 'claude'
      ? claudeConfig?.path || path.join(home, '.claude', 'CLAUDE.md')
      : claudeConfig.path;

    if (fs.existsSync(claudePath)) {
      console.log(chalk.blue(`  Importing from ${claudePath}...\n`));
      const parsed = parseClaudeMd(claudePath);

      // Merge parsed data into aisona
      if (parsed.preferences.tone) aisona.preferences.tone = parsed.preferences.tone;
      if (parsed.preferences.habits.length) aisona.preferences.habits = parsed.preferences.habits;
      if (parsed.preferences.teaching) aisona.preferences.teaching = parsed.preferences.teaching;
      if (parsed.preferences.autonomy) aisona.preferences.autonomy = parsed.preferences.autonomy;
      if (parsed.rules.length) aisona.rules = parsed.rules;
      if (parsed.memories.length) aisona.memories = parsed.memories;

      console.log(chalk.green(`  Imported: ${parsed.rules.length} rules, ${parsed.preferences.habits.length} habits, ${parsed.memories.length} memories\n`));
    }
  }

  // Interactive: ask for basic identity info if not imported
  if (!aisona.identity.name) {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Your name (or alias):', default: process.env.USER || '' },
      { type: 'input', name: 'role', message: 'Your role:', default: 'Software developer' },
      { type: 'input', name: 'language', message: 'Preferred AI response language:', default: 'English' },
    ]);
    aisona.identity.name = answers.name;
    aisona.identity.role = answers.role;
    aisona.identity.language = answers.language;
  }

  // Ask which tools to enable
  const toolChoices = ['claude', 'cursor', 'gemini', 'copilot', 'windsurf'];
  const detectedToolIds = detected.map(d => d.tool);
  const defaultEnabled = toolChoices.filter(t => detectedToolIds.includes(t));

  const { enabledTools } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'enabledTools',
    message: 'Which tools do you want to export to?',
    choices: toolChoices.map(t => ({
      name: t + (detectedToolIds.includes(t) ? chalk.dim(' (detected)') : ''),
      value: t,
      checked: defaultEnabled.includes(t) || t === 'claude' || t === 'cursor',
    })),
  }]);

  for (const tool of toolChoices) {
    if (aisona.tools[tool]) {
      aisona.tools[tool].enabled = enabledTools.includes(tool);
    }
  }

  // Save
  const outPath = path.join(dir, 'aisona.yml');
  saveAisona(outPath, aisona);

  console.log(chalk.green(`\n  Created ${outPath}\n`));
  console.log(chalk.dim('  Next steps:'));
  console.log(chalk.dim('    1. Edit aisona.yml to refine your persona'));
  console.log(chalk.dim('    2. Run: aisona export --all'));
  console.log(chalk.dim('    3. Run: aisona watch --git  (auto-sync)\n'));
}
