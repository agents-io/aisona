import path from 'path';
import chalk from 'chalk';
import { findAisonaFile, loadAisona } from '../lib/config.js';
import { exportToTool, exportToAll, getSupportedTools } from '../lib/exporter.js';

export async function exportCommand(options) {
  const dir = path.resolve(options.dir || process.cwd());

  console.log(chalk.bold('\n  aisona export\n'));

  // Find aisona.yml
  const aisonaPath = findAisonaFile(dir);
  if (!aisonaPath) {
    console.log(chalk.red('  No aisona.yml found. Run: aisona init\n'));
    process.exit(1);
  }

  const aisona = loadAisona(aisonaPath);
  console.log(chalk.dim(`  Using: ${aisonaPath}\n`));

  if (options.to) {
    // Export to specific tool
    const toolId = options.to.toLowerCase();
    const supported = getSupportedTools();

    if (!supported.includes(toolId)) {
      console.log(chalk.red(`  Unknown tool: ${toolId}`));
      console.log(chalk.dim(`  Supported: ${supported.join(', ')}\n`));
      process.exit(1);
    }

    const result = exportToTool(aisona, toolId, dir);
    if (result.success) {
      console.log(chalk.green(`  Exported to ${result.tool} → ${result.path}\n`));
    } else {
      console.log(chalk.red(`  Failed: ${result.error}\n`));
    }
  } else if (options.all) {
    // Export to all enabled tools
    const results = exportToAll(aisona, dir);

    if (results.length === 0) {
      console.log(chalk.yellow('  No tools enabled in aisona.yml.\n'));
      return;
    }

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    for (const r of succeeded) {
      console.log(chalk.green(`  ✓ ${r.tool} → ${r.path}`));
    }
    for (const r of failed) {
      console.log(chalk.red(`  ✗ ${r.tool}: ${r.error}`));
    }

    console.log(chalk.dim(`\n  Exported to ${succeeded.length} tool(s)\n`));
  } else {
    console.log(chalk.yellow('  Specify --to <tool> or --all\n'));
    console.log(chalk.dim('  Examples:'));
    console.log(chalk.dim('    aisona export --to claude'));
    console.log(chalk.dim('    aisona export --to cursor'));
    console.log(chalk.dim('    aisona export --all\n'));
  }
}
