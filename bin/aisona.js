#!/usr/bin/env node

import { program } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { exportCommand } from '../src/commands/export.js';
import { statusCommand } from '../src/commands/status.js';
import { watchCommand } from '../src/commands/watch.js';

program
  .name('aisona')
  .description('Own your AI\'s persona. Define it once, use it everywhere.')
  .version('0.1.0');

program
  .command('init')
  .description('Create aisona.yml from your existing AI tool configs')
  .option('--from <tool>', 'Import from a specific tool (claude, cursor, gemini)')
  .option('--dir <path>', 'Working directory', process.cwd())
  .action(initCommand);

program
  .command('export')
  .description('Export aisona.yml to AI tool configs')
  .option('--to <tool>', 'Export to a specific tool (claude, cursor, gemini, copilot)')
  .option('--all', 'Export to all enabled tools')
  .option('--dir <path>', 'Working directory', process.cwd())
  .action(exportCommand);

program
  .command('status')
  .description('Show what tools are detected and sync status')
  .option('--dir <path>', 'Working directory', process.cwd())
  .action(statusCommand);

program
  .command('watch')
  .description('Watch aisona.yml and auto re-export on change')
  .option('--dir <path>', 'Working directory', process.cwd())
  .option('--git', 'Auto git commit + push on change')
  .action(watchCommand);

program.parse();
