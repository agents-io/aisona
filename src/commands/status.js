import path from 'path';
import chalk from 'chalk';
import { findAisonaFile, loadAisona } from '../lib/config.js';
import { detectTools } from '../lib/parser.js';
import { getSupportedTools } from '../lib/exporter.js';

export async function statusCommand(options) {
  const dir = path.resolve(options.dir || process.cwd());

  console.log(chalk.bold('\n  aisona status\n'));

  // Check for aisona.yml
  const aisonaPath = findAisonaFile(dir);
  if (!aisonaPath) {
    console.log(chalk.yellow('  No aisona.yml found. Run: aisona init\n'));

    // Still show detected tools
    const detected = detectTools(dir);
    if (detected.length > 0) {
      console.log(chalk.blue('  Detected AI tool configs:\n'));
      for (const d of detected) {
        console.log(`    ${chalk.cyan(d.tool)} (${d.scope}) → ${chalk.dim(d.path)}`);
      }
      console.log();
    }
    return;
  }

  const aisona = loadAisona(aisonaPath);

  // Persona summary
  console.log(chalk.blue('  Persona:'));
  if (aisona.identity?.name) console.log(`    Name: ${aisona.identity.name}`);
  if (aisona.identity?.role) console.log(`    Role: ${aisona.identity.role}`);
  if (aisona.identity?.language) console.log(`    Language: ${aisona.identity.language}`);
  console.log(`    Rules: ${aisona.rules?.length || 0}`);
  console.log(`    Preferences: ${aisona.preferences?.length || 0}`);
  console.log(`    Memories: ${aisona.memories?.length || 0}`);
  console.log();

  // Tool status
  console.log(chalk.blue('  Tools:'));
  const supported = getSupportedTools();
  for (const toolId of supported) {
    const config = aisona.tools?.[toolId];
    const enabled = config?.enabled !== false;
    const icon = enabled ? chalk.green('✓') : chalk.dim('○');
    console.log(`    ${icon} ${toolId}${!enabled ? chalk.dim(' (disabled)') : ''}`);
  }
  console.log();

  // Detected configs
  const detected = detectTools(dir);
  if (detected.length > 0) {
    console.log(chalk.blue('  Detected existing configs:'));
    for (const d of detected) {
      console.log(`    ${chalk.cyan(d.tool)} → ${chalk.dim(d.path)}`);
    }
    console.log();
  }

  console.log(chalk.dim(`  aisona.yml: ${aisonaPath}\n`));
}
