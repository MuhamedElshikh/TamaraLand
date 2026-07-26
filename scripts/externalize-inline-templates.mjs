import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src', 'app');

async function main() {
  const files = await collectTsFiles(ROOT);
  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    if (original.includes('templateUrl:') || !original.includes('template: `')) {
      continue;
    }

    const match = original.match(/template:\s*`([\s\S]*?)`\s*,?/);
    if (!match) {
      continue;
    }

    const template = dedent(match[1]).trim();
    const htmlPath = file.replace(/\.ts$/, '.html');
    const cssPath = file.replace(/\.ts$/, '.css');
    const updated = original.replace(
      /template:\s*`[\s\S]*?`\s*,?/,
      `templateUrl: './${path.basename(htmlPath)}',\n  styleUrl: './${path.basename(cssPath)}'`
    );

    await fs.writeFile(file, updated, 'utf8');
    await fs.writeFile(htmlPath, `${template}\n`, 'utf8');

    try {
      await fs.access(cssPath);
    } catch {
      await fs.writeFile(cssPath, '', 'utf8');
    }
  }
}

async function collectTsFiles(dir) {
  const result = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectTsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      result.push(fullPath);
    }
  }
  return result;
}

function dedent(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const indent = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(indent)).join('\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
