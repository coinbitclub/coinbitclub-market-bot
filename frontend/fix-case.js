// fix-case.js
const fs   = require('fs');
const path = require('path');

// PascalCase helper
function toPascal(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 1) Walk & rename all .jsx under src/pages to PascalCase.jsx
function walkAndRename(dir) {
  for (let name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walkAndRename(full);
    } else if (full.endsWith('.jsx')) {
      const base   = path.basename(full, '.jsx');
      const pascal = toPascal(base);
      if (base !== pascal) {
        const target = path.join(dir, pascal + '.jsx');
        fs.renameSync(full, target);
        console.log(`Renamed: ${name} → ${pascal}.jsx`);
      }
    }
  }
}

// 2) Patch src/App.jsx imports to match PascalCase file-names
function fixImports(appFile) {
  let content = fs.readFileSync(appFile, 'utf8');

  // painel components
  content = content.replace(
    /from\s+["']\.\/pages\/painel\/([a-z]\w*)["']/g,
    (_, m) => `from "./pages/painel/${toPascal(m)}"`
  );

  // other pages
  content = content.replace(
    /from\s+["']\.\/pages\/([a-z]\w*)["']/g,
    (_, m) => `from "./pages/${toPascal(m)}"`
  );

  fs.writeFileSync(appFile, content);
  console.log(`Imports updated in ${appFile}`);
}

// run it
const PAGES    = path.join(__dirname, 'src', 'pages');
const APP_FILE = path.join(__dirname, 'src', 'App.jsx');

walkAndRename(PAGES);
fixImports(APP_FILE);
