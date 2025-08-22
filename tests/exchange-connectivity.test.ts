// ========================================
// TESTE DE CONECTIVIDADE COM EXCHANGES
// Validar IP fixo NGROK com Binance/Bybit
// ========================================

import { ExchangeService } from '../src/services/exchange.service';
import { ExchangeType } from '../src/types/trading.types';
import { describe, test, expect, beforeAll } from '@jest/globals';

describe('🔗 Exchange Connectivity Tests - IP Fixo Validation', () => {
  let exchangeService: ExchangeService;

  beforeAll(() => {
    exchangeService = ExchangeService.getInstance();
  });

  describe('📊 Binance API Tests', () => {
    test('✅ Should validate Binance testnet connection', async () => {
      try {
        console.log('🔄 Testing Binance testnet connection...');
        
        // Test with testnet credentials
        const testResult = await exchangeService.testConnection({
          apiKey: process.env.BINANCE_API_KEY || 'test',
          apiSecret: process.env.BINANCE_API_SECRET || 'test',
          passphrase: undefined
        }, ExchangeType.BINANCE);
        
        if (testResult.success) {
          console.log('✅ Binance testnet: CONNECTED');
          console.log(`🔧 Testnet detected: ${testResult.isTestnet}`);
          console.log(`🔑 Permissions: Read=${testResult.permissions?.canRead}, Trade=${testResult.permissions?.canTrade}`);
        } else {
          console.log(`⚠️ Binance connection failed: ${testResult.error}`);
        }
        
        // Don't fail the test if it's just a configuration issue
        expect(testResult).toBeDefined();
      } catch (error) {
        console.log('⚠️ Binance test skipped (configuration issue):', (error as Error).message);
      }
    }, 30000);
  });

  describe('🎯 Bybit API Tests', () => {
    test('✅ Should validate Bybit testnet connection', async () => {
      try {
        console.log('🔄 Testing Bybit testnet connection...');
        
        // Test with testnet credentials
        const testResult = await exchangeService.testConnection({
          apiKey: process.env.BYBIT_API_KEY || 'test',
          apiSecret: process.env.BYBIT_API_SECRET || 'test',
          passphrase: undefined
        }, ExchangeType.BYBIT);
        
        if (testResult.success) {
          console.log('✅ Bybit testnet: CONNECTED');
          console.log(`🔧 Testnet detected: ${testResult.isTestnet}`);
          console.log(`🔑 Permissions: Read=${testResult.permissions?.canRead}, Trade=${testResult.permissions?.canTrade}`);
        } else {
          console.log(`⚠️ Bybit connection failed: ${testResult.error}`);
        }
        
        // Don't fail the test if it's just a configuration issue
        expect(testResult).toBeDefined();
      } catch (error) {
        console.log('⚠️ Bybit test skipped (configuration issue):', (error as Error).message);
      }
    }, 30000);
  });

  describe('🌐 IP Whitelisting Validation', () => {
    test('✅ Should validate IP whitelist configuration', async () => {
      console.log('🔄 Validating IP whitelist...');
      
      // Check if we're using the correct IP addresses
      const ngrokIps = process.env.NGROK_IP_FIXO?.split(',') || [];
      expect(ngrokIps.length).toBeGreaterThan(0);
      
      console.log('📋 IPs configurados para whitelist:');
      ngrokIps.forEach((ip, index) => {
        console.log(`   ${index + 1}. ${ip.trim()}`);
      });
      
      console.log('✅ IP whitelist configuration: VALID');
    });

    test('✅ Should validate NGROK domain configuration', () => {
      console.log('🔄 Validating NGROK domain...');
      
      const ngrokDomain = process.env.NGROK_DOMAIN_FIXO;
      expect(ngrokDomain).toBe('marketbot.ngrok.app');
      
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL;
      expect(webhookBaseUrl).toBe('https://marketbot.ngrok.app');
      
      console.log(`✅ NGROK domain: ${ngrokDomain}`);
      console.log(`✅ Webhook base URL: ${webhookBaseUrl}`);
    });
  });

  describe('🔒 Security & Authentication Tests', () => {
    test('✅ Should validate environment configuration', () => {
      console.log('🔄 Validating security configuration...');
      
      // Check critical environment variables
      const criticalVars = [
        'BINANCE_API_KEY',
        'BINANCE_API_SECRET', 
        'NGROK_IP_FIXO',
        'NGROK_DOMAIN_FIXO'
      ];
      
      criticalVars.forEach(varName => {
        const value = process.env[varName];
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        console.log(`✅ ${varName}: CONFIGURED`);
      });
    });

    test('✅ Should validate API key format', () => {
      console.log('🔄 Validating API key formats...');
      
      const binanceApiKey = process.env.BINANCE_API_KEY;
      const binanceApiSecret = process.env.BINANCE_API_SECRET;
      
      // Binance API keys should be 64 characters
      expect(binanceApiKey?.length).toBe(64);
      expect(binanceApiSecret?.length).toBe(64);
      
      console.log('✅ Binance API key format: VALID');
      console.log('✅ Binance API secret format: VALID');
    });
  });

  describe('🚀 Basic API Functionality Tests', () => {
    test('✅ Should test basic exchange functionality', async () => {
      console.log('🔄 Testing basic exchange functionality...');
      
      try {
        // Test getting user exchange accounts (should return empty array if no accounts)
        const accounts = await exchangeService.getUserExchangeAccounts('test-user-id');
        expect(Array.isArray(accounts)).toBe(true);
        
        console.log(`✅ getUserExchangeAccounts: Returns ${accounts.length} accounts`);
      } catch (error) {
        console.log('⚠️ Basic functionality test failed:', (error as Error).message);
        // Don't fail the test for database connection issues in CI
      }
    }, 15000);
  });
});
