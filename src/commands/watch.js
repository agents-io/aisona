import path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { simpleGit } from 'simple-git';
import { findAisonaFile, loadAisona } from '../lib/config.js';
import { exportToAll } from '../lib/exporter.js';

export async function watchCommand(options) {
  const dir = path.resolve(options.dir || process.cwd());
  const useGit = options.git || false;

  console.log(chalk.bold('\n  aisona watch\n'));

  const aisonaPath = findAisonaFile(dir);
  if (!aisonaPath) {
    console.log(chalk.red('  No aisona.yml found. Run: aisona init\n'));
    process.exit(1);
  }

  console.log(chalk.dim(`  Watching: ${aisonaPath}`));
  if (useGit) console.log(chalk.dim('  Git auto-commit: enabled'));
  console.log(chalk.dim('  Press Ctrl+C to stop.\n'));

  // Do initial export
  await doExport(aisonaPath, dir, useGit);

  // Watch for changes
  let debounceTimer = null;

  const watcher = chokidar.watch(aisonaPath, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', () => {
    // Debounce: wait 2s after last change before exporting
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      doExport(aisonaPath, dir, useGit);
    }, 2000);
  });

  // Keep process alive
  process.on('SIGINT', () => {
    console.log(chalk.dim('\n  Stopped watching.\n'));
    watcher.close();
    process.exit(0);
  });
}

async function doExport(aisonaPath, dir, useGit) {
  try {
    const aisona = loadAisona(aisonaPath);
    const results = exportToAll(aisona, dir);

    const succeeded = results.filter(r => r.success);
    const timestamp = new Date().toLocaleTimeString();

    if (succeeded.length > 0) {
      const tools = succeeded.map(r => r.tool).join(', ');
      console.log(chalk.green(`  [${timestamp}] Exported to: ${tools}`));

      if (useGit) {
        await gitCommitAndPush(dir, succeeded);
      }
    }
  } catch (err) {
    console.log(chalk.red(`  Error: ${err.message}`));
  }
}

async function gitCommitAndPush(dir, exportResults) {
  try {
    const git = simpleGit(dir);

    // Check if we're in a git repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      console.log(chalk.dim('    (not a git repo — skipping git sync)'));
      return;
    }

    // Stage exported files + aisona.yml
    const files = ['aisona.yml', ...exportResults.map(r => path.relative(dir, r.path))];
    await git.add(files);

    // Check if there are staged changes
    const status = await git.status();
    if (status.staged.length === 0) {
      return; // Nothing to commit
    }

    // Commit
    const tools = exportResults.map(r => r.tool).join(', ');
    await git.commit(`aisona: auto-sync persona to ${tools}`);
    console.log(chalk.dim('    git: committed'));

    // Push if remote exists
    try {
      const remotes = await git.getRemotes(true);
      if (remotes.length > 0) {
        await git.push();
        console.log(chalk.dim('    git: pushed'));
      }
    } catch {
      // Push failed — probably no remote or auth issue. Silently skip.
    }
  } catch (err) {
    console.log(chalk.dim(`    git: ${err.message}`));
  }
}
