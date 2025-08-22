// ========================================
// MARKETBOT - DATABASE STATUS CHECKER
// Verificação do estado atual do banco de dados
// ========================================

import { DatabaseService } from '../services/database.service.js';

const checkDatabaseStatus = async () => {
  try {
    const db = DatabaseService.getInstance();
    
    console.log('🔍 VERIFICANDO STATUS DO BANCO DE DADOS...\n');
    
    // 1. Verificar migrações executadas
    console.log('📋 MIGRAÇÕES EXECUTADAS:');
    try {
      const migrations = await db.query(`
        SELECT migration_name, executed_at 
        FROM database_migrations 
        ORDER BY executed_at ASC
      `);
      
      if (migrations.rows.length === 0) {
        console.log('❌ Nenhuma migração encontrada');
      } else {
        migrations.rows.forEach((m: any) => {
          console.log(`✅ ${m.migration_name} - ${new Date(m.executed_at).toLocaleString()}`);
        });
      }
    } catch (error) {
      console.log('❌ Tabela de migrações não existe');
    }
    
    console.log('\n📊 TABELAS EXISTENTES:');
    const tables = await db.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    // Categorizar tabelas por fase
    const fase1Tables = ['database_migrations'];
    const fase2Tables = ['users', 'affiliates', 'user_sessions', 'verification_tokens', 'audit_logs'];
    const fase3Tables = ['user_exchange_accounts', 'trading_signals', 'trading_positions', 'trading_orders', 'trading_settings', 'market_data'];
    
    let fase1Count = 0, fase2Count = 0, fase3Count = 0;
    
    tables.rows.forEach((t: any) => {
      const tableName = t.table_name;
      let fase = '';
      
      if (fase1Tables.includes(tableName)) {
        fase = '(FASE 1 - Infraestrutura)';
        fase1Count++;
      } else if (fase2Tables.includes(tableName)) {
        fase = '(FASE 2 - Autenticação)';
        fase2Count++;
      } else if (fase3Tables.includes(tableName)) {
        fase = '(FASE 3 - Trading)';
        fase3Count++;
      } else {
        fase = '(Outra)';
      }
      
      console.log(`📋 ${tableName} ${fase}`);
    });
    
    console.log('\n🎯 RESUMO POR FASE:');
    console.log(`📦 FASE 1 (Infraestrutura): ${fase1Count}/${fase1Tables.length} tabelas`);
    console.log(`🔐 FASE 2 (Autenticação): ${fase2Count}/${fase2Tables.length} tabelas`);
    console.log(`📈 FASE 3 (Trading): ${fase3Count}/${fase3Tables.length} tabelas`);
    
    // Verificar ENUMs do trading
    console.log('\n🔢 ENUMS DO SISTEMA DE TRADING:');
    try {
      const enums = await db.query(`
        SELECT typname as enum_name 
        FROM pg_type 
        WHERE typtype = 'e' 
        AND typname LIKE '%_type' OR typname LIKE '%_status' OR typname LIKE '%_side'
        ORDER BY typname
      `);
      
      enums.rows.forEach((e: any) => {
        console.log(`🏷️  ${e.enum_name}`);
      });
    } catch (error) {
      console.log('❌ Erro ao verificar ENUMs');
    }
    
    // Verificar functions e triggers
    console.log('\n⚙️ FUNCTIONS E TRIGGERS:');
    try {
      const functions = await db.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name
      `);
      
      functions.rows.forEach((f: any) => {
        console.log(`🔧 ${f.routine_name}()`);
      });
    } catch (error) {
      console.log('❌ Erro ao verificar functions');
    }
    
    // Status final
    console.log('\n🎉 STATUS GERAL:');
    
    if (fase1Count === fase1Tables.length) {
      console.log('✅ FASE 1: COMPLETA');
    } else {
      console.log('❌ FASE 1: INCOMPLETA');
    }
    
    if (fase2Count === fase2Tables.length) {
      console.log('✅ FASE 2: COMPLETA');
    } else {
      console.log('❌ FASE 2: INCOMPLETA');
    }
    
    if (fase3Count === fase3Tables.length) {
      console.log('✅ FASE 3: COMPLETA');
    } else {
      console.log('❌ FASE 3: INCOMPLETA');
    }
    
    console.log('\n✨ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  } finally {
    process.exit(0);
  }
};

checkDatabaseStatus();
