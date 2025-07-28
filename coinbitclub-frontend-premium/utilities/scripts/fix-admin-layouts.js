// Script para corrigir layout de todas as páginas administrativas
const fs = require('fs');
const path = require('path');

const adminPages = [
  'alerts-new.tsx',
  'adjustments-new.tsx', 
  'accounting-new.tsx',
  'settings-new.tsx'
];

const basePath = 'c:\\Nova pasta\\coinbitclub-market-bot\\coinbitclub-frontend-premium\\pages\\admin\\';

adminPages.forEach(filename => {
  const fullPath = path.join(basePath, filename);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Corrigindo ${filename}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Corrigir layout principal
    content = content.replace(
      /div className="min-h-screen bg-black">/g,
      'div className="min-h-screen bg-black flex">'
    );
    
    // Corrigir sidebar
    content = content.replace(
      /lg:translate-x-0 lg:static lg:inset-0/g,
      'lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64'
    );
    
    // Corrigir main content
    content = content.replace(
      /lg:ml-64/g,
      'flex-1 lg:w-0'
    );
    
    // Adicionar atualização a cada 60 segundos
    if (content.includes('setInterval') && content.includes('30000')) {
      content = content.replace(/30000/g, '60000');
      content = content.replace(/30 segundos/g, '60 segundos (1 minuto)');
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filename} corrigido com sucesso!`);
  } else {
    console.log(`⚠️ ${filename} não encontrado`);
  }
});

console.log('Correções de layout concluídas!');
