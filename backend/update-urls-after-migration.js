// Script para Atualizar URLs Após Migração
// Atualiza automaticamente todas as URLs relacionadas ao novo projeto Railway
// Execute: node update-urls-after-migration.js <nova-url>

const fs = require('fs');
const path = require('path');

console.log('🔗 ATUALIZADOR DE URLs PÓS-MIGRAÇÃO');
console.log('===================================');
console.log('');

// Obter nova URL
const newUrl = process.argv[2];

if (!newUrl) {
  console.log('❌ URL não fornecida');
  console.log('💡 Uso: node update-urls-after-migration.js <nova-url>');
  console.log('📝 Exemplo: node update-urls-after-migration.js https://coinbitclub-market-bot-v2-production.up.railway.app');
  process.exit(1);
}

// Validar URL
try {
  new URL(newUrl);
  console.log(`✅ URL válida: ${newUrl}`);
} catch (error) {
  console.log('❌ URL inválida:', error.message);
  process.exit(1);
}

console.log('');

// Configurações de atualização
const UPDATE_CONFIG = {
  newUrl: newUrl.replace(/\/$/, ''), // Remove trailing slash
  backupSuffix: '.backup-migration',
  filesToUpdate: [
    {
      path: '.env',
      updates: [
        { key: 'REACT_APP_API_URL', value: null },
        { key: 'FRONTEND_URL', value: null }
      ]
    },
    {
      path: '.env.production',
      updates: [
        { key: 'REACT_APP_API_URL', value: null },
        { key: 'FRONTEND_URL', value: null }
      ]
    },
    {
      path: 'api-gateway/.env',
      updates: [
        { key: 'REACT_APP_API_URL', value: null },
        { key: 'FRONTEND_URL', value: null }
      ]
    },
    {
      path: 'api-gateway/.env.production',
      updates: [
        { key: 'REACT_APP_API_URL', value: null },
        { key: 'FRONTEND_URL', value: null }
      ]
    }
  ],
  railwayVariables: [
    { key: 'REACT_APP_API_URL', value: null },
    { key: 'FRONTEND_URL', value: null },
    { key: 'STRIPE_SUCCESS_URL', value: '/sucesso?session_id={CHECKOUT_SESSION_ID}' },
    { key: 'STRIPE_CANCEL_URL', value: '/cancelado' }
  ]
};

// Preencher valores
UPDATE_CONFIG.filesToUpdate.forEach(file => {
  file.updates.forEach(update => {
    update.value = UPDATE_CONFIG.newUrl;
  });
});

UPDATE_CONFIG.railwayVariables.forEach(variable => {
  if (variable.key === 'STRIPE_SUCCESS_URL') {
    variable.value = UPDATE_CONFIG.newUrl + variable.value;
  } else if (variable.key === 'STRIPE_CANCEL_URL') {
    variable.value = UPDATE_CONFIG.newUrl + variable.value;
  } else {
    variable.value = UPDATE_CONFIG.newUrl;
  }
});

// Função para fazer backup de arquivo
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = filePath + UPDATE_CONFIG.backupSuffix;
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Backup criado: ${backupPath}`);
    return true;
  }
  return false;
}

// Função para atualizar arquivo .env
function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
    return false;
  }
  
  console.log(`📝 Atualizando: ${filePath}`);
  
  // Fazer backup
  backupFile(filePath);
  
  // Ler conteúdo
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Atualizar cada variável
  updates.forEach(update => {
    const regex = new RegExp(`^${update.key}=.*$`, 'gm');
    const newLine = `${update.key}=${update.value}`;
    
    if (regex.test(content)) {
      content = content.replace(regex, newLine);
      console.log(`  ✅ ${update.key} atualizada`);
      updated = true;
    } else {
      // Adicionar no final se não existir
      content += `\n${newLine}`;
      console.log(`  ➕ ${update.key} adicionada`);
      updated = true;
    }
  });
  
  // Salvar arquivo
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`  💾 Arquivo salvo`);
  }
  
  return updated;
}

// Função para gerar comandos Railway
function generateRailwayCommands() {
  console.log('🚂 COMANDOS RAILWAY PARA EXECUTAR:');
  console.log('================================');
  console.log('');
  console.log('Execute os seguintes comandos no terminal:');
  console.log('');
  
  UPDATE_CONFIG.railwayVariables.forEach(variable => {
    console.log(`railway variables set "${variable.key}=${variable.value}"`);
  });
  
  console.log('');
  console.log('💡 Ou execute tudo de uma vez:');
  console.log('');
  
  const allCommands = UPDATE_CONFIG.railwayVariables
    .map(v => `railway variables set "${v.key}=${v.value}"`)
    .join(' && ');
  
  console.log(allCommands);
  console.log('');
}

// Função para gerar script PowerShell
function generatePowerShellScript() {
  const scriptContent = `# Script PowerShell para atualizar variáveis Railway
# Gerado automaticamente em: ${new Date().toISOString()}
# Nova URL: ${UPDATE_CONFIG.newUrl}

Write-Host "🔗 Atualizando variáveis Railway para nova URL..." -ForegroundColor Green
Write-Host "Nova URL: ${UPDATE_CONFIG.newUrl}" -ForegroundColor Cyan
Write-Host ""

${UPDATE_CONFIG.railwayVariables.map(v => 
  `Write-Host "🔧 Configurando ${v.key}..." -ForegroundColor Cyan
railway variables set "${v.key}=${v.value}"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ ${v.key} configurada" -ForegroundColor Green
} else {
    Write-Host "  ❌ Erro ao configurar ${v.key}" -ForegroundColor Red
}`
).join('\n\n')}

Write-Host ""
Write-Host "✅ Todas as variáveis foram atualizadas!" -ForegroundColor Green
Write-Host "🧪 Teste a nova URL: ${UPDATE_CONFIG.newUrl}/health" -ForegroundColor Yellow`;

  fs.writeFileSync('update-railway-urls.ps1', scriptContent);
  console.log('📄 Script PowerShell criado: update-railway-urls.ps1');
  console.log('💡 Execute: .\\update-railway-urls.ps1');
  console.log('');
}

// Função para criar relatório de migração
function createMigrationReport() {
  const report = {
    migration_date: new Date().toISOString(),
    new_url: UPDATE_CONFIG.newUrl,
    updated_files: [],
    railway_variables: UPDATE_CONFIG.railwayVariables,
    next_steps: [
      'Execute o script update-railway-urls.ps1',
      'Teste a nova URL: ' + UPDATE_CONFIG.newUrl + '/health',
      'Atualize webhooks do TradingView',
      'Atualize URLs no frontend',
      'Execute testes completos'
    ],
    rollback_info: {
      backup_files: UPDATE_CONFIG.filesToUpdate
        .map(f => f.path + UPDATE_CONFIG.backupSuffix)
        .filter(f => fs.existsSync(f)),
      old_url: 'https://coinbitclub-market-bot-production.up.railway.app'
    }
  };
  
  // Identificar arquivos atualizados
  UPDATE_CONFIG.filesToUpdate.forEach(file => {
    if (fs.existsSync(file.path)) {
      report.updated_files.push(file.path);
    }
  });
  
  fs.writeFileSync('migration-urls-report.json', JSON.stringify(report, null, 2));
  console.log('📊 Relatório de migração criado: migration-urls-report.json');
  console.log('');
}

// Executar atualizações
async function updateUrls() {
  console.log('🚀 Iniciando atualização de URLs...');
  console.log('');
  
  let filesUpdated = 0;
  
  // Atualizar arquivos .env
  UPDATE_CONFIG.filesToUpdate.forEach(file => {
    if (updateEnvFile(file.path, file.updates)) {
      filesUpdated++;
    }
  });
  
  console.log('');
  console.log(`📊 Resumo: ${filesUpdated} arquivos atualizados`);
  console.log('');
  
  // Gerar comandos e scripts
  generateRailwayCommands();
  generatePowerShellScript();
  createMigrationReport();
  
  // Instruções finais
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('==================');
  console.log('');
  console.log('1. Execute o script PowerShell gerado:');
  console.log('   .\\update-railway-urls.ps1');
  console.log('');
  console.log('2. Teste a nova URL:');
  console.log(`   ${UPDATE_CONFIG.newUrl}/health`);
  console.log('');
  console.log('3. Atualize webhooks externos:');
  console.log('   - TradingView webhooks');
  console.log('   - Notificações Stripe');
  console.log('   - Frontend configurações');
  console.log('');
  console.log('4. Execute testes completos:');
  console.log(`   node test-migration.js ${UPDATE_CONFIG.newUrl}`);
  console.log('');
  console.log('🎉 Atualização de URLs concluída!');
}

// Executar
updateUrls().catch(error => {
  console.error('💥 Erro na atualização:', error);
  process.exit(1);
});
