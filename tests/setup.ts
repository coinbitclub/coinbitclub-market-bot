// ========================================
// MARKETBOT - TEST SETUP
// Configuração inicial para testes
// ========================================

export const setupTestDatabase = async () => {
  // Mock do banco de dados para testes
  const mockDb = {
    isConnected: () => true,
    query: async (sql: string, params?: any[]) => {
      // Simular diferentes respostas baseadas na query
      if (sql.includes('SELECT 1')) {
        return { rows: [{ test: 1 }] };
      }
      if (sql.includes('information_schema.schemata')) {
        return { rows: [{ schema_name: 'public' }] };
      }
      if (sql.includes('information_schema.tables')) {
        // Tabelas básicas das fases 1-3
        const basicTables = [
          { table_name: 'users' },
          { table_name: 'trading_signals' },
          { table_name: 'user_exchange_accounts' },
          { table_name: 'trading_positions' },
          { table_name: 'schema_migrations' },
          { table_name: 'database_migrations' },
          { table_name: 'affiliates' },
          { table_name: 'user_sessions' },
          { table_name: 'verification_tokens' },
          { table_name: 'audit_logs' },
          { table_name: 'trading_orders' },
          { table_name: 'trading_settings' },
          { table_name: 'market_data' }
        ];

        // Tabelas da Fase 4 - Market Intelligence
        const marketTables = [
          { table_name: 'market_fear_greed_history' },
          { table_name: 'market_pulse_history' },
          { table_name: 'market_btc_dominance_history' },
          { table_name: 'market_decisions' },
          { table_name: 'market_ai_analyses' },
          { table_name: 'market_configurations' }
        ];

        return {
          rows: [...basicTables, ...marketTables]
        };
      }
      if (sql.includes('information_schema.columns')) {
        // Colunas básicas
        const basicColumns = [
          { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
          { column_name: 'email', data_type: 'varchar', is_nullable: 'NO' },
          { column_name: 'user_id', data_type: 'uuid', is_nullable: 'NO' },
          { column_name: 'symbol', data_type: 'varchar', is_nullable: 'NO' },
          { column_name: 'exchange', data_type: 'exchange_type', is_nullable: 'NO' }
        ];

        // Colunas específicas das tabelas de market intelligence
        if (sql.includes('market_configurations')) {
          return {
            rows: [
              { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
              { column_name: 'fear_greed_extreme_fear', data_type: 'integer', is_nullable: 'NO' },
              { column_name: 'fear_greed_extreme_greed', data_type: 'integer', is_nullable: 'NO' },
              { column_name: 'ai_enabled', data_type: 'boolean', is_nullable: 'NO' },
              { column_name: 'ai_model', data_type: 'varchar', is_nullable: 'YES' },
              { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO' },
              { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO' },
              { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'NO' }
            ]
          };
        }

        if (sql.includes('market_decisions')) {
          return {
            rows: [
              { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
              { column_name: 'allow_long', data_type: 'boolean', is_nullable: 'NO' },
              { column_name: 'allow_short', data_type: 'boolean', is_nullable: 'NO' },
              { column_name: 'confidence', data_type: 'integer', is_nullable: 'NO' },
              { column_name: 'reasons', data_type: 'text[]', is_nullable: 'YES' },
              { column_name: 'ai_analysis', data_type: 'jsonb', is_nullable: 'YES' },
              { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO' }
            ]
          };
        }

        return { rows: basicColumns };
      }
      if (sql.includes('pg_type') && sql.includes('typtype = \'e\'')) {
        return {
          rows: [
            { enum_name: 'exchange_type' },
            { enum_name: 'signal_type' },
            { enum_name: 'order_type' },
            { enum_name: 'order_side' },
            { enum_name: 'order_status' },
            { enum_name: 'position_status' },
            { enum_name: 'signal_status' },
            { enum_name: 'user_role' }
          ]
        };
      }
      if (sql.includes('pg_enum')) {
        return {
          rows: [
            { enumlabel: 'BINANCE' },
            { enumlabel: 'BYBIT' },
            { enumlabel: 'LONG' },
            { enumlabel: 'SHORT' },
            { enumlabel: 'CLOSE_LONG' }
          ]
        };
      }
      if (sql.includes('COUNT(*)')) {
        return { rows: [{ count: '12', total_tables: '12', total_enums: '8', total_constraints: '25', total_indexes: '15' }] };
      }
      if (sql.includes('information_schema.triggers')) {
        return {
          rows: [
            { trigger_name: 'update_updated_at_trigger', event_object_table: 'users' },
            { trigger_name: 'update_updated_at_trigger', event_object_table: 'trading_signals' }
          ]
        };
      }
      if (sql.includes('information_schema.routines')) {
        return {
          rows: [
            { routine_name: 'update_updated_at_column' },
            { routine_name: 'calculate_position_pnl' }
          ]
        };
      }
      if (sql.includes('information_schema.table_constraints')) {
        return {
          rows: [
            { constraint_name: 'users_pkey', table_name: 'users', constraint_type: 'PRIMARY KEY', column_name: 'id', foreign_table_name: null, foreign_column_name: null },
            { constraint_name: 'users_email_unique', table_name: 'users', constraint_type: 'UNIQUE', column_name: 'email', foreign_table_name: null, foreign_column_name: null },
            { constraint_name: 'trading_positions_user_fk', table_name: 'trading_positions', constraint_type: 'FOREIGN KEY', column_name: 'user_id', foreign_table_name: 'users', foreign_column_name: 'id' }
          ]
        };
      }
      if (sql.includes('information_schema.key_column_usage')) {
        return {
          rows: [
            { constraint_name: 'users_pkey', table_name: 'users', column_name: 'id' },
            { constraint_name: 'users_email_unique', table_name: 'users', column_name: 'email' }
          ]
        };
      }
      if (sql.includes('pg_indexes')) {
        return {
          rows: [
            { indexname: 'users_pkey', tablename: 'users' },
            { indexname: 'users_email_idx', tablename: 'users' },
            { indexname: 'trading_signals_symbol_idx', tablename: 'trading_signals' }
          ]
        };
      }
      return { rows: [] };
    }
  };
  
  return mockDb;
};

export const cleanupTestDatabase = async () => {
  console.log('Cleanup de teste finalizado');
};

// Mock para usuário de teste
export const mockUser = {
  id: 'test-user-123',
  email: 'test@marketbot.com',
  name: 'Test User'
};

// Mock para request/response
export const createMockReq = (body?: any, params?: any, query?: any, user?: any) => ({
  body: body || {},
  params: params || {},
  query: query || {},
  user: user || mockUser
});

export const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
