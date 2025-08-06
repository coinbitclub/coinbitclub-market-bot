const fs = require('fs');
const path = require('path');

console.log('🚨 CAÇADOR DE EMERGÊNCIA - CARACTERES NUL');
console.log('==========================================');

// Função para detectar arquivos com NUL em modo binário
function scanForNulCharacters(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const nullPositions = [];
        
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === 0) { // NUL character
                nullPositions.push(i);
            }
        }
        
        return nullPositions;
    } catch (error) {
        return null;
    }
}

// Função para limpar arquivo em modo binário
function cleanFileFromNul(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const cleanBuffer = Buffer.from(buffer.filter(byte => byte !== 0));
        fs.writeFileSync(filePath, cleanBuffer);
        return true;
    } catch (error) {
        console.error(`Erro ao limpar ${filePath}: ${error.message}`);
        return false;
    }
}

// Função para escanear diretório recursivamente
function scanDirectory(dirPath, extensions = ['.js', '.json', '.cjs', '.ts', '.tsx']) {
    const problematicFiles = [];
    
    function scanRecursive(currentPath) {
        try {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(currentPath, item.name);
                
                if (item.isDirectory()) {
                    // Pular node_modules e .git
                    if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                        scanRecursive(fullPath);
                    }
                } else if (item.isFile()) {
                    const ext = path.extname(item.name);
                    if (extensions.includes(ext) || item.name.includes('package') || item.name.includes('railway')) {
                        const nullPositions = scanForNulCharacters(fullPath);
                        if (nullPositions && nullPositions.length > 0) {
                            problematicFiles.push({
                                path: fullPath,
                                relative: path.relative(dirPath, fullPath),
                                nullCount: nullPositions.length,
                                positions: nullPositions.slice(0, 10) // Primeiras 10 posições
                            });
                        }
                    }
                }
            }
        } catch (error) {
            // Ignore permission errors
        }
    }
    
    scanRecursive(dirPath);
    return problematicFiles;
}

// Função principal
async function emergencyNulHunt() {
    console.log('\n🔍 ESCANEANDO TODO O PROJETO...');
    
    const rootDir = __dirname;
    const problematicFiles = scanDirectory(rootDir);
    
    if (problematicFiles.length === 0) {
        console.log('✅ Nenhum arquivo com caracteres NUL encontrado!');
        return;
    }
    
    console.log(`\n❌ ENCONTRADOS ${problematicFiles.length} ARQUIVOS COM CARACTERES NUL:`);
    console.log('================================================================');
    
    for (const file of problematicFiles) {
        console.log(`\n📄 ${file.relative}`);
        console.log(`   Caracteres NUL: ${file.nullCount}`);
        console.log(`   Posições: ${file.positions.join(', ')}${file.nullCount > 10 ? '...' : ''}`);
        
        // Fazer backup antes de limpar
        const backupPath = file.path + '.nul-backup-' + Date.now();
        try {
            fs.copyFileSync(file.path, backupPath);
            console.log(`   💾 Backup: ${path.basename(backupPath)}`);
        } catch (error) {
            console.log(`   ❌ Erro no backup: ${error.message}`);
        }
        
        // Limpar arquivo
        if (cleanFileFromNul(file.path)) {
            console.log(`   ✅ Arquivo limpo com sucesso!`);
            
            // Verificar se é JSON e validar
            if (file.path.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(file.path, 'utf8');
                    JSON.parse(content);
                    console.log(`   ✅ JSON válido após limpeza`);
                } catch (jsonError) {
                    console.log(`   ❌ JSON inválido após limpeza: ${jsonError.message}`);
                    await fixCorruptedJson(file.path);
                }
            }
        } else {
            console.log(`   ❌ Falha ao limpar arquivo`);
        }
    }
    
    console.log('\n🔄 VERIFICANDO NOVAMENTE...');
    const remainingFiles = scanDirectory(rootDir);
    
    if (remainingFiles.length === 0) {
        console.log('🎉 TODOS OS CARACTERES NUL FORAM ELIMINADOS!');
    } else {
        console.log(`⚠️  Ainda restam ${remainingFiles.length} arquivos problemáticos`);
        
        // Lista os arquivos restantes
        for (const file of remainingFiles) {
            console.log(`   - ${file.relative} (${file.nullCount} caracteres NUL)`);
        }
    }
}

// Função para corrigir JSONs corrompidos
async function fixCorruptedJson(filePath) {
    const fileName = path.basename(filePath);
    
    console.log(`   🔧 Reconstruindo JSON: ${fileName}`);
    
    if (fileName.includes('package.json')) {
        // Determinar se é frontend ou backend
        const isBackend = filePath.includes('backend') || filePath.includes('api-gateway');
        const isFrontend = filePath.includes('frontend') || filePath.includes('coinbitclub-frontend');
        
        let packageStructure;
        
        if (isFrontend) {
            packageStructure = {
                "name": "coinbitclub-frontend-premium",
                "version": "0.1.0",
                "private": true,
                "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start",
                    "lint": "next lint"
                },
                "dependencies": {
                    "next": "14.2.30",
                    "react": "^18",
                    "react-dom": "^18",
                    "tailwindcss": "^3.4.0",
                    "lucide-react": "^0.263.1"
                },
                "engines": {
                    "node": ">=18.0.0"
                }
            };
        } else if (isBackend) {
            packageStructure = {
                "name": "coinbitclub-api-gateway",
                "version": "1.0.0",
                "main": "server.js",
                "scripts": {
                    "start": "node server.js",
                    "dev": "nodemon server.js"
                },
                "dependencies": {
                    "express": "^4.18.2",
                    "cors": "^2.8.5",
                    "helmet": "^7.0.0"
                }
            };
        } else {
            packageStructure = {
                "name": "coinbitclub-market-bot",
                "version": "3.0.0",
                "description": "CoinBitClub Market Bot V3 - Emergency Fixed",
                "main": "main.js",
                "scripts": {
                    "start": "node main.js",
                    "dev": "node main.js",
                    "test": "echo \"Emergency fix applied\""
                },
                "engines": {
                    "node": ">=18.0.0"
                },
                "dependencies": {
                    "express": "^4.18.2",
                    "cors": "^2.8.5",
                    "helmet": "^7.0.0",
                    "compression": "^1.7.4",
                    "pg": "^8.11.3"
                }
            };
        }
        
        fs.writeFileSync(filePath, JSON.stringify(packageStructure, null, 2), 'utf8');
        console.log(`   ✅ package.json reconstruído`);
        
    } else if (fileName.includes('railway.json')) {
        const railwayStructure = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "NIXPACKS"
            },
            "deploy": {
                "startCommand": "node main.js",
                "healthcheckPath": "/health",
                "healthcheckTimeout": 100,
                "restartPolicyType": "ON_FAILURE"
            }
        };
        
        fs.writeFileSync(filePath, JSON.stringify(railwayStructure, null, 2), 'utf8');
        console.log(`   ✅ railway.json reconstruído`);
    }
}

// Executar
emergencyNulHunt().catch(console.error);
