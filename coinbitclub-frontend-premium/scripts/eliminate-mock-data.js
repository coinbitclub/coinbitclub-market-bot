#!/usr/bin/env node

/**
 * 🚨 SCRIPT DE ELIMINAÇÃO TOTAL DE DADOS MOCK
 * 
 * Este script remove TODOS os dados mock/fake/hardcoded das páginas
 * e substitui por "-" para identificar dados não integrados.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Padrões para identificar dados mock
const MOCK_PATTERNS = [
  // Comentários explícitos sobre mock
  /\/\/.*[mM]ock.*data/g,
  /\/\*.*[mM]ock.*data.*\*\//g,
  
  // Variáveis mock
  /const\s+mock[A-Z]\w*\s*[:=]/g,
  /let\s+mock[A-Z]\w*\s*[:=]/g,
  /var\s+mock[A-Z]\w*\s*[:=]/g,
  
  // Arrays e objetos com dados estáticos
  /const\s+\w*Data\s*[:=]\s*\[[\s\S]*?\];/g,
  /const\s+\w*Records\s*[:=]\s*\[[\s\S]*?\];/g,
  
  // Valores monetários hardcoded
  /R\$\s*\d+[,.]?\d*/g,
  /USD\s*\d+[,.]?\d*/g,
  /\$\s*\d+[,.]?\d*/g,
  
  // Números de exemplo
  /1\.?[0-9]{3,}/g, // Números grandes como 1000, 1234, etc
  /amount:\s*\d+\.?\d*/g,
  /balance:\s*\d+\.?\d*/g,
  /price:\s*\d+\.?\d*/g,
];

// Valores de substituição seguros
const SAFE_REPLACEMENTS = {
  // Valores numéricos
  'amount': '0',
  'balance': '0',
  'price': '0',
  'total': '0',
  'count': '0',
  
  // Strings descritivas
  'name': '"-"',
  'description': '"-"',
  'title': '"-"',
  'email': '"-"',
  'phone': '"-"',
  
  // Arrays/listas
  'data': '[]',
  'records': '[]',
  'items': '[]',
  'list': '[]',
};

// Função para limpar dados mock de um arquivo
function cleanMockData(filePath) {
  console.log(`🧹 Limpando mocks em: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modifications = 0;

  // 1. Remover comentários sobre mock
  content = content.replace(/\/\/.*[mM]ock.*data.*$/gm, '// TODO: Integrar com backend real');
  content = content.replace(/\/\*.*[mM]ock.*data.*\*\//g, '/* TODO: Integrar com backend real */');

  // 2. Substituir arrays de dados mock
  content = content.replace(/const\s+mock(\w+)\s*[:=]\s*\[[\s\S]*?\];/g, (match, varName) => {
    modifications++;
    return `const ${varName.toLowerCase()} = []; // TODO: Fetch from backend`;
  });

  // 3. Substituir objetos mock
  content = content.replace(/const\s+mock(\w+)\s*[:=]\s*\{[\s\S]*?\};/g, (match, varName) => {
    modifications++;
    return `const ${varName.toLowerCase()} = null; // TODO: Fetch from backend`;
  });

  // 4. Substituir valores monetários por "-"
  content = content.replace(/R\$\s*\d+[,.]?\d*/g, '"-"');
  content = content.replace(/USD\s*\d+[,.]?\d*/g, '"-"');
  content = content.replace(/\$\s*\d+[,.]?\d*/g, '"-"');

  // 5. Substituir propriedades com valores hardcoded
  content = content.replace(/amount:\s*\d+\.?\d*/g, 'amount: 0');
  content = content.replace(/balance:\s*\d+\.?\d*/g, 'balance: 0');
  content = content.replace(/price:\s*\d+\.?\d*/g, 'price: 0');
  content = content.replace(/total:\s*\d+\.?\d*/g, 'total: 0');

  // 6. Substituir nomes/emails de exemplo
  content = content.replace(/'[A-Z][a-z]+\s+[A-Z][a-z]+'/g, '"-"'); // Nomes como 'João Silva'
  content = content.replace(/'\w+@\w+\.\w+'/g, '"-"'); // Emails
  content = content.replace(/'\+55\s*\(\d{2}\)\s*\d{4,5}-?\d{4}'/g, '"-"'); // Telefones

  // 7. Remover ou comentar linhas que usam dados mock
  content = content.replace(/.*mockRecords.*$/gm, '// TODO: Use real data from backend');
  content = content.replace(/.*mockData.*$/gm, '// TODO: Use real data from backend');
  content = content.replace(/.*mock[A-Z]\w*.*$/gm, '// TODO: Use real data from backend');

  if (modifications > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${modifications} modificações feitas em ${path.basename(filePath)}`);
  } else {
    console.log(`ℹ️  Nenhum mock encontrado em ${path.basename(filePath)}`);
  }

  return modifications;
}

// Função para processar todos os arquivos
function processAllFiles() {
  console.log('🚀 INICIANDO ELIMINAÇÃO TOTAL DE DADOS MOCK\n');

  // Buscar todos os arquivos .tsx nas páginas
  const patterns = [
    'pages/**/*.tsx',
    'src/pages/**/*.tsx',
    'pages/**/*.jsx',
    'src/pages/**/*.jsx'
  ];

  let totalFiles = 0;
  let totalModifications = 0;

  patterns.forEach(pattern => {
    glob.sync(pattern).forEach(file => {
      // Ignorar arquivos já integrados ou específicos
      if (file.includes('-integrated') || 
          file.includes('_app') || 
          file.includes('_document') ||
          file.includes('.backup') ||
          file.includes('.disabled')) {
        return;
      }

      totalFiles++;
      const modifications = cleanMockData(file);
      totalModifications += modifications;
    });
  });

  console.log('\n📊 RELATÓRIO FINAL:');
  console.log(`📁 Arquivos processados: ${totalFiles}`);
  console.log(`🔧 Total de modificações: ${totalModifications}`);
  console.log(`✅ Limpeza de mocks concluída!\n`);

  // Gerar relatório de arquivos que ainda precisam de integração
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Integrar endpoints backend para dados reais');
  console.log('2. Substituir valores "-" por dados reais via API');
  console.log('3. Testar todas as funcionalidades');
  console.log('4. Verificar se não há mais dados hardcoded\n');
}

// Executar se chamado diretamente
if (require.main === module) {
  processAllFiles();
}

module.exports = { cleanMockData, processAllFiles };
