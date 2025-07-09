import { getUserSettings, getUserStatus } from '../src/services/userService.js';
import { pool } from '../src/services/db.js';

// Mock manual (ou configure via setup global)
jest.mock('../src/services/db.js', () => {
  const original = jest.requireActual('../src/services/db.js');
  return {
    ...original,
    pool: {
      query: jest.fn()
    }
  };
});

describe('userService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('deve retornar configurações personalizadas se existirem', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ leverage: 5, capitalPct: 10, stopPct: 2 }],
        rowCount: 1
      });

      const result = await getUserSettings(123);

      expect(result).toEqual({
        sizing: '10%',
        tp: '3%',
        sl: '-2%',
        ativos: 'BTCUSDT,ETHUSDT'
      });
    });

    it('deve retornar configurações padrão se não houver personalizadas', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await getUserSettings(456);

      expect(result).toEqual({
        sizing: '5%',
        tp: '3%',
        sl: '-10%',
        ativos: 'BTCUSDT,ETHUSDT'
      });
    });
  });

  describe('getUserStatus', () => {
    it('deve retornar assinatura ativa e saldo', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ tipo_plano: 'mensal', is_active: true }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [{ saldo_apos: 300 }],
          rowCount: 1
        });

      const result = await getUserStatus(123);

      expect(result).toEqual({
        assinatura_ativa: true,
        plano: 'mensal',
        saldo_pre_pago: 300
      });
    });

    it('deve retornar assinatura inativa e saldo zero se nada encontrado', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await getUserStatus(789);

      expect(result).toEqual({
        assinatura_ativa: false,
        plano: null,
        saldo_pre_pago: 0
      });
    });
  });
});
