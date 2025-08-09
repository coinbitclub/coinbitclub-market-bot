#!/usr/bin/env node
/**
 * 🧪 SCRIPT DE VALIDAÇÃO PÓS-DEPLOY
 * Verifica se o deploy em produção está funcionando corretamente
 */

const https = require('https');
const http = require('http');

class ProductionValidator {
  constructor(frontendUrl, backendUrl) {
    this.frontendUrl = frontendUrl;
    this.backendUrl = backendUrl;
    this.results = {
      frontend: {},
      backend: {},
      integration: {},
      overall: { passed: 0, failed: 0 }
    };
  }

  async validateProduction() {
    console.log('🚀 INICIANDO VALIDAÇÃO DE PRODUÇÃO');
    console.log(`📱 Frontend: ${this.frontendUrl}`);
    console.log(`🖥️ Backend: ${this.backendUrl}`);
    console.log('');

    // Validações do Backend
    await this.validateBackendHealth();
    await this.validateBackendStatus();
    await this.validateBackendAPIs();

    // Validações do Frontend
    await this.validateFrontendHealth();
    await this.validateFrontendPages();

    // Validações de Integração
    await this.validateCORS();
    await this.validateAuthentication();

    // Relatório Final
    this.generateReport();
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? https : http;
      const startTime = Date.now();
      
      const req = lib.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            duration: duration
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async validateBackendHealth() {
    console.log('🔍 Validando Backend Health...');
    
    try {
      const response = await this.makeRequest(`${this.backendUrl}/health`);
      
      if (response.statusCode === 200) {
        console.log('✅ Backend Health OK');
        this.results.backend.health = { status: 'PASS', duration: response.duration };
        this.results.overall.passed++;
      } else {
        console.log('❌ Backend Health FAIL:', response.statusCode);
        this.results.backend.health = { status: 'FAIL', error: `Status ${response.statusCode}` };
        this.results.overall.failed++;
      }
    } catch (error) {
      console.log('❌ Backend Health ERROR:', error.message);
      this.results.backend.health = { status: 'ERROR', error: error.message };
      this.results.overall.failed++;
    }
  }

  async validateBackendStatus() {
    console.log('🔍 Validando Backend Status...');
    
    try {
      const response = await this.makeRequest(`${this.backendUrl}/api/status`);
      
      if (response.statusCode === 200) {
        console.log('✅ Backend Status OK');
        this.results.backend.status = { status: 'PASS', duration: response.duration };
        this.results.overall.passed++;
      } else {
        console.log('❌ Backend Status FAIL:', response.statusCode);
        this.results.backend.status = { status: 'FAIL', error: `Status ${response.statusCode}` };
        this.results.overall.failed++;
      }
    } catch (error) {
      console.log('❌ Backend Status ERROR:', error.message);
      this.results.backend.status = { status: 'ERROR', error: error.message };
      this.results.overall.failed++;
    }
  }

  async validateBackendAPIs() {
    console.log('🔍 Validando Backend APIs...');
    
    const apiEndpoints = [
      '/api/test/database',
      '/api/test/auth',
      '/api/dashboard/user',
      '/api/dashboard/admin'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await this.makeRequest(`${this.backendUrl}${endpoint}`);
        
        if (response.statusCode === 200 || response.statusCode === 401) {
          // 401 é aceitável para endpoints protegidos
          console.log(`✅ API ${endpoint} OK`);
          this.results.overall.passed++;
        } else {
          console.log(`❌ API ${endpoint} FAIL:`, response.statusCode);
          this.results.overall.failed++;
        }
      } catch (error) {
        console.log(`❌ API ${endpoint} ERROR:`, error.message);
        this.results.overall.failed++;
      }
    }
  }

  async validateFrontendHealth() {
    console.log('🔍 Validando Frontend Health...');
    
    try {
      const response = await this.makeRequest(this.frontendUrl);
      
      if (response.statusCode === 200) {
        console.log('✅ Frontend Health OK');
        this.results.frontend.health = { status: 'PASS', duration: response.duration };
        this.results.overall.passed++;
      } else {
        console.log('❌ Frontend Health FAIL:', response.statusCode);
        this.results.frontend.health = { status: 'FAIL', error: `Status ${response.statusCode}` };
        this.results.overall.failed++;
      }
    } catch (error) {
      console.log('❌ Frontend Health ERROR:', error.message);
      this.results.frontend.health = { status: 'ERROR', error: error.message };
      this.results.overall.failed++;
    }
  }

  async validateFrontendPages() {
    console.log('🔍 Validando Frontend Pages...');
    
    const pages = [
      '/login',
      '/signup',
      '/dashboard',
      '/admin',
      '/user'
    ];

    for (const page of pages) {
      try {
        const response = await this.makeRequest(`${this.frontendUrl}${page}`);
        
        if (response.statusCode === 200) {
          console.log(`✅ Page ${page} OK`);
          this.results.overall.passed++;
        } else {
          console.log(`❌ Page ${page} FAIL:`, response.statusCode);
          this.results.overall.failed++;
        }
      } catch (error) {
        console.log(`❌ Page ${page} ERROR:`, error.message);
        this.results.overall.failed++;
      }
    }
  }

  async validateCORS() {
    console.log('🔍 Validando CORS...');
    
    try {
      const response = await this.makeRequest(`${this.backendUrl}/api/status`);
      
      if (response.headers['access-control-allow-origin']) {
        console.log('✅ CORS Headers Present');
        this.results.integration.cors = { status: 'PASS' };
        this.results.overall.passed++;
      } else {
        console.log('⚠️ CORS Headers Missing');
        this.results.integration.cors = { status: 'WARNING' };
      }
    } catch (error) {
      console.log('❌ CORS Check ERROR:', error.message);
      this.results.integration.cors = { status: 'ERROR', error: error.message };
      this.results.overall.failed++;
    }
  }

  async validateAuthentication() {
    console.log('🔍 Validando Authentication...');
    
    try {
      const response = await this.makeRequest(`${this.backendUrl}/api/user/profile`);
      
      if (response.statusCode === 401) {
        console.log('✅ Authentication Working (401 expected)');
        this.results.integration.auth = { status: 'PASS' };
        this.results.overall.passed++;
      } else {
        console.log('⚠️ Authentication Unexpected Status:', response.statusCode);
        this.results.integration.auth = { status: 'WARNING', statusCode: response.statusCode };
      }
    } catch (error) {
      console.log('❌ Authentication Check ERROR:', error.message);
      this.results.integration.auth = { status: 'ERROR', error: error.message };
      this.results.overall.failed++;
    }
  }

  generateReport() {
    console.log('');
    console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('================================');
    
    const total = this.results.overall.passed + this.results.overall.failed;
    const successRate = total > 0 ? ((this.results.overall.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`✅ Testes Aprovados: ${this.results.overall.passed}`);
    console.log(`❌ Testes Reprovados: ${this.results.overall.failed}`);
    console.log(`📈 Taxa de Sucesso: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('🎉 PRODUÇÃO APROVADA! Sistema operacional.');
    } else if (successRate >= 70) {
      console.log('⚠️ PRODUÇÃO COM PROBLEMAS. Revisar falhas.');
    } else {
      console.log('🚨 PRODUÇÃO REPROVADA. Correções necessárias.');
    }
    
    console.log('');
    console.log('📋 Detalhes:');
    console.log(`Backend Health: ${this.results.backend.health?.status || 'NOT_TESTED'}`);
    console.log(`Frontend Health: ${this.results.frontend.health?.status || 'NOT_TESTED'}`);
    console.log(`CORS: ${this.results.integration.cors?.status || 'NOT_TESTED'}`);
    console.log(`Auth: ${this.results.integration.auth?.status || 'NOT_TESTED'}`);
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Uso: node validate-production.js <frontend_url> <backend_url>');
    console.log('Exemplo: node validate-production.js https://coinbitclub.vercel.app https://coinbitclub-backend.railway.app');
    process.exit(1);
  }
  
  const [frontendUrl, backendUrl] = args;
  const validator = new ProductionValidator(frontendUrl, backendUrl);
  
  validator.validateProduction().catch(error => {
    console.error('Erro na validação:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;
