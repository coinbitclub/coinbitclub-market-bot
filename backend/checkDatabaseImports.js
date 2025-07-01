import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd(); // roda na pasta backend

async function findJsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? findJsFiles(res) : (res.endsWith('.js') ? [res] : []);
  }));
  return files.flat();
}

async function extractDatabaseImports(file) {
  const content = await fs.readFile(file, 'utf-8');
  const lines = content.split('\n');

  // Regex para capturar imports do database.js e extrair funções importadas
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"][^'"]*database\.js['"]/;

  const imports = [];

  for (const line of lines) {
    const match = importRegex.exec(line);
    if (match) {
      // extrai nomes, limpa espaços e quebras
      const funcs = match[1].split(',').map(f => f.trim());
      imports.push(...funcs);
    }
  }

  return imports;
}

async function main() {
  const jsFiles = await findJsFiles(projectRoot);

  const report = {};

  for (const file of jsFiles) {
    const imports = await extractDatabaseImports(file);
    if (imports.length > 0) {
      // mostra caminho relativo
      const relPath = path.relative(projectRoot, file);
      report[relPath] = imports;
    }
  }

  console.log('\n### Relatório de imports do database.js ###\n');
  for (const [file, funcs] of Object.entries(report)) {
    console.log(`${file}:\n  - ${funcs.join('\n  - ')}\n`);
  }
}

main().catch(e => {
  console.error('Erro ao executar:', e);
});
