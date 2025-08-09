import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Interface para controle do sistema
interface SystemControlRequest {
  action: 'start' | 'stop';
}

interface SystemControlResponse {
  success: boolean;
  message: string;
  systemStatus: 'active' | 'inactive' | 'maintenance';
  services?: {
    [key: string]: {
      status: 'online' | 'offline' | 'starting' | 'stopping';
      lastUpdate: string;
    };
  };
}

// Simulação de controle de microserviços
const mockServices: {
  [key: string]: {
    status: 'online' | 'offline' | 'starting' | 'stopping';
    lastUpdate: string;
  };
} = {
  'signal-ingestor': { status: 'online', lastUpdate: new Date().toISOString() },
  'signal-processor': { status: 'online', lastUpdate: new Date().toISOString() },
  'decision-engine': { status: 'online', lastUpdate: new Date().toISOString() },
  'order-executor': { status: 'online', lastUpdate: new Date().toISOString() },
  'database-monitor': { status: 'online', lastUpdate: new Date().toISOString() },
  'risk-manager': { status: 'online', lastUpdate: new Date().toISOString() }
};

// Estado global do sistema (em produção seria um cache Redis ou banco)
let currentSystemStatus: 'active' | 'inactive' | 'maintenance' = 'active';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SystemControlResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      systemStatus: currentSystemStatus
    });
  }

  try {
    // Verificar autenticação
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso necessário',
        systemStatus: currentSystemStatus
      });
    }

    // Verificar se é administrador
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'coinbitclub-secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        systemStatus: currentSystemStatus
      });
    }

    // Verificar se o usuário tem permissão de administrador
    if (typeof decodedToken === 'object' && decodedToken.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem controlar o sistema.',
        systemStatus: currentSystemStatus
      });
    }

    const { action }: SystemControlRequest = req.body;

    if (!action || !['start', 'stop'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Ação inválida. Use "start" ou "stop".',
        systemStatus: currentSystemStatus
      });
    }

    // Simular controle do sistema
    console.log(`[SYSTEM CONTROL] ${action.toUpperCase()} solicitado por admin`);

    if (action === 'start') {
      // Simular inicialização dos serviços
      console.log('[SYSTEM CONTROL] Iniciando serviços...');
      
      // Atualizar status dos serviços
      Object.keys(mockServices).forEach(service => {
        mockServices[service as keyof typeof mockServices] = {
          status: 'starting' as const,
          lastUpdate: new Date().toISOString()
        };
      });

      // Simular delay de inicialização
      setTimeout(() => {
        Object.keys(mockServices).forEach(service => {
          mockServices[service as keyof typeof mockServices] = {
            status: 'online' as const,
            lastUpdate: new Date().toISOString()
          };
        });
      }, 2000);

      currentSystemStatus = 'active';

      return res.status(200).json({
        success: true,
        message: 'Sistema iniciado com sucesso. Todos os serviços estão online.',
        systemStatus: currentSystemStatus,
        services: mockServices
      });

    } else if (action === 'stop') {
      // Simular parada dos serviços
      console.log('[SYSTEM CONTROL] Finalizando serviços...');
      
      // Atualizar status dos serviços
      Object.keys(mockServices).forEach(service => {
        mockServices[service as keyof typeof mockServices] = {
          status: 'stopping' as const,
          lastUpdate: new Date().toISOString()
        };
      });

      // Simular delay de finalização
      setTimeout(() => {
        Object.keys(mockServices).forEach(service => {
          mockServices[service as keyof typeof mockServices] = {
            status: 'offline' as const,
            lastUpdate: new Date().toISOString()
          };
        });
      }, 1500);

      currentSystemStatus = 'inactive';

      return res.status(200).json({
        success: true,
        message: 'Sistema finalizado com sucesso. Todos os serviços foram pausados.',
        systemStatus: currentSystemStatus,
        services: mockServices
      });
    }

  } catch (error) {
    console.error('[SYSTEM CONTROL] Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      systemStatus: currentSystemStatus
    });
  }
}

// Função para obter status atual do sistema
export async function getSystemStatus() {
  return {
    systemStatus: currentSystemStatus,
    services: mockServices,
    lastUpdate: new Date().toISOString()
  };
}
