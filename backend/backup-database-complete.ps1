# 🗄️ BACKUP COMPLETO DO BANCO DE DADOS RAILWAY
# Script para fazer backup completo dos dados antes da migração
# Execute: .\backup-database-complete.ps1

param(
    [string]$OutputFile = "",
    [switch]$StructureOnly = $false,
    [switch]$DataOnly = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️ BACKUP COMPLETO DO BANCO DE DADOS" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""

# Definir nome do arquivo de backup se não fornecido
if (!$OutputFile) {
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    if ($StructureOnly) {
        $OutputFile = "backup-structure-$Timestamp.sql"
    } elseif ($DataOnly) {
        $OutputFile = "backup-data-$Timestamp.sql"
    } else {
        $OutputFile = "backup-complete-$Timestamp.sql"
    }
}

Write-Host "📄 Arquivo de backup: $OutputFile" -ForegroundColor Cyan
Write-Host ""

# Obter DATABASE_URL atual
Write-Host "🔍 Obtendo configuração do banco atual..." -ForegroundColor Cyan

$DatabaseUrl = $null

# Tentar várias fontes para DATABASE_URL
$Sources = @(
    { Get-Content ".env" -ErrorAction SilentlyContinue | Where-Object { $_ -match "DATABASE_URL=" } | ForEach-Object { $_.Split("=")[1] } },
    { Get-Content "api-gateway/.env" -ErrorAction SilentlyContinue | Where-Object { $_ -match "DATABASE_URL=" } | ForEach-Object { $_.Split("=")[1] } },
    { railway variables get DATABASE_URL 2>$null }
)

foreach ($Source in $Sources) {
    try {
        $Result = & $Source
        if ($Result) {
            $DatabaseUrl = $Result
            break
        }
    } catch {
        continue
    }
}

if (!$DatabaseUrl) {
    Write-Host "❌ DATABASE_URL não encontrada" -ForegroundColor Red
    Write-Host "💡 Verifique se está conectado ao projeto Railway" -ForegroundColor Yellow
    Write-Host "💡 Ou configure a DATABASE_URL no arquivo .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL encontrada: $($DatabaseUrl.Substring(0, 50))..." -ForegroundColor Green
Write-Host ""

# Verificar se pg_dump está disponível
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    Write-Host "✅ pg_dump encontrado - usando backup nativo PostgreSQL" -ForegroundColor Green
    
    # Construir comando pg_dump
    $PgDumpArgs = @(
        "--no-password",
        "--verbose",
        "--clean",
        "--if-exists"
    )
    
    if ($StructureOnly) {
        $PgDumpArgs += "--schema-only"
        Write-Host "📋 Modo: Apenas estrutura" -ForegroundColor Cyan
    } elseif ($DataOnly) {
        $PgDumpArgs += "--data-only"
        Write-Host "📊 Modo: Apenas dados" -ForegroundColor Cyan
    } else {
        Write-Host "📦 Modo: Estrutura + Dados completos" -ForegroundColor Cyan
    }
    
    $PgDumpArgs += @(
        "--file=$OutputFile",
        $DatabaseUrl
    )
    
    Write-Host "🚀 Executando backup..." -ForegroundColor Cyan
    Write-Host "   Comando: pg_dump $($PgDumpArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    try {
        & pg_dump @PgDumpArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backup concluído com sucesso!" -ForegroundColor Green
            
            # Verificar tamanho do arquivo
            if (Test-Path $OutputFile) {
                $FileSize = (Get-Item $OutputFile).Length
                $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
                Write-Host "📊 Tamanho do backup: $FileSizeMB MB" -ForegroundColor Cyan
                
                # Verificar conteúdo básico
                $Lines = (Get-Content $OutputFile).Count
                Write-Host "📄 Linhas no backup: $Lines" -ForegroundColor Cyan
            }
        } else {
            Write-Host "❌ Erro no backup" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Erro ao executar pg_dump: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Tentando backup alternativo..." -ForegroundColor Yellow
    }
    
} else {
    Write-Host "⚠️ pg_dump não encontrado - usando backup via Node.js" -ForegroundColor Yellow
    
    # Criar script Node.js para backup
    $BackupScript = @"
const { Pool } = require('pg');
const fs = require('fs');

console.log('🔍 Conectando ao banco de dados...');

const pool = new Pool({
  connectionString: '$DatabaseUrl',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function createBackup() {
  let output = '';
  
  try {
    const client = await pool.connect();
    
    // Cabeçalho do backup
    output += '-- ==========================================\n';
    output += '-- BACKUP AUTOMÁTICO RAILWAY\n';
    output += '-- Data: ' + new Date().toISOString() + '\n';
    output += '-- ==========================================\n\n';
    
    console.log('📋 Obtendo lista de tabelas...');
    
    // Obter lista de tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️ Nenhuma tabela encontrada');
      output += '-- Nenhuma tabela encontrada no banco\n';
    } else {
      console.log(`📊 Encontradas \${tablesResult.rows.length} tabelas`);
      
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        console.log(`📋 Processando tabela: \${tableName}`);
        
        try {
          // Obter estrutura da tabela
          if (!$DataOnly) {
            const createTableResult = await client.query(`
              SELECT pg_get_tabledef('\${tableName}'::regclass) as tabledef
            `);
            
            if (createTableResult.rows.length > 0) {
              output += `-- Estrutura da tabela: \${tableName}\n`;
              output += createTableResult.rows[0].tabledef + ';\n\n';
            } else {
              // Fallback para estrutura básica
              const columnsResult = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '\${tableName}' 
                ORDER BY ordinal_position
              `);
              
              if (columnsResult.rows.length > 0) {
                output += `-- Estrutura da tabela: \${tableName}\n`;
                output += `CREATE TABLE IF NOT EXISTS \${tableName} (\n`;
                
                const columns = columnsResult.rows.map(col => {
                  let colDef = `  \${col.column_name} \${col.data_type.toUpperCase()}`;
                  if (col.is_nullable === 'NO') colDef += ' NOT NULL';
                  if (col.column_default) colDef += ` DEFAULT \${col.column_default}`;
                  return colDef;
                });
                
                output += columns.join(',\n') + '\n);\n\n';
              }
            }
          }
          
          // Obter dados da tabela
          if (!$StructureOnly) {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM \${tableName}`);
            const rowCount = parseInt(countResult.rows[0].count);
            
            if (rowCount > 0) {
              console.log(`📊 Exportando \${rowCount} registros de \${tableName}`);
              
              const dataResult = await client.query(`SELECT * FROM \${tableName} ORDER BY 1 LIMIT 10000`);
              
              if (dataResult.rows.length > 0) {
                // Obter nomes das colunas
                const columns = Object.keys(dataResult.rows[0]);
                
                output += `-- Dados da tabela: \${tableName} (\${rowCount} registros)\n`;
                
                // Gerar INSERTs em lotes
                const batchSize = 100;
                for (let i = 0; i < dataResult.rows.length; i += batchSize) {
                  const batch = dataResult.rows.slice(i, i + batchSize);
                  
                  output += `INSERT INTO \${tableName} (\${columns.join(', ')}) VALUES\n`;
                  
                  const values = batch.map(row => {
                    const rowValues = columns.map(col => {
                      const value = row[col];
                      if (value === null) return 'NULL';
                      if (typeof value === 'string') return `'\${value.replace(/'/g, "''")}'`;
                      if (typeof value === 'object') return `'\${JSON.stringify(value).replace(/'/g, "''")}'`;
                      return value;
                    });
                    return `(\${rowValues.join(', ')})`;
                  });
                  
                  output += values.join(',\n') + ';\n\n';
                }
                
                if (rowCount > 10000) {
                  output += `-- ATENÇÃO: Apenas os primeiros 10.000 registros foram exportados de \${tableName}\n`;
                  output += `-- Total de registros na tabela: \${rowCount}\n\n`;
                }
              }
            } else {
              output += `-- Tabela \${tableName} está vazia\n\n`;
            }
          }
          
        } catch (tableError) {
          console.error(`❌ Erro ao processar tabela \${tableName}:`, tableError.message);
          output += `-- Erro ao processar tabela \${tableName}: \${tableError.message}\n\n`;
        }
      }
    }
    
    // Obter índices e constraints
    if (!$DataOnly) {
      console.log('🔍 Obtendo índices...');
      
      const indexesResult = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
        ORDER BY indexname
      `);
      
      if (indexesResult.rows.length > 0) {
        output += '-- Índices\n';
        indexesResult.rows.forEach(index => {
          output += index.indexdef + ';\n';
        });
        output += '\n';
      }
    }
    
    client.release();
    await pool.end();
    
    // Salvar arquivo
    fs.writeFileSync('$OutputFile', output, 'utf8');
    
    console.log('✅ Backup concluído com sucesso!');
    console.log(`📄 Arquivo: $OutputFile`);
    console.log(`📊 Tamanho: \${Math.round(output.length / 1024)} KB`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no backup:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createBackup();
"@
    
    # Salvar e executar script
    $BackupScript | Out-File -FilePath "backup-script.js" -Encoding UTF8
    
    Write-Host "🚀 Executando backup via Node.js..." -ForegroundColor Cyan
    $BackupResult = node backup-script.js 2>&1
    
    Write-Host $BackupResult
    
    # Limpar script temporário
    Remove-Item "backup-script.js" -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no backup via Node.js" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $OutputFile) {
    $FileInfo = Get-Item $OutputFile
    $FileSizeMB = [math]::Round($FileInfo.Length / 1MB, 2)
    
    Write-Host "📊 INFORMAÇÕES DO BACKUP:" -ForegroundColor Cyan
    Write-Host "  • Arquivo: $OutputFile" -ForegroundColor White
    Write-Host "  • Tamanho: $FileSizeMB MB" -ForegroundColor White
    Write-Host "  • Data: $($FileInfo.CreationTime)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔧 PARA RESTAURAR NO NOVO BANCO:" -ForegroundColor Yellow
    Write-Host "  psql `$NEW_DATABASE_URL < $OutputFile" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 OU VIA RAILWAY:" -ForegroundColor Yellow
    Write-Host "  railway connect postgres" -ForegroundColor White
    Write-Host "  \i $OutputFile" -ForegroundColor White
    Write-Host ""
    
    Write-Host "✅ Backup pronto para uso na migração!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Arquivo de backup não foi criado" -ForegroundColor Red
    exit 1
}
