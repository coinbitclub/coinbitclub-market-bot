// Enums e tipos para o sistema Enterprise de perfis
export enum UserProfile {
  BASIC = 'basic',
  PREMIUM = 'premium', 
  ENTERPRISE = 'enterprise',
  AFFILIATE_NORMAL = 'affiliate_normal',
  AFFILIATE_VIP = 'affiliate_vip',
  ADMIN = 'admin'
}

// Interface para dados completos do perfil do usuário
export interface UserProfileData {
  // Identificação
  id?: number;
  user_id: number;
  profile_type: UserProfile;
  
  // Dados Pessoais Obrigatórios
  nome_completo: string;
  cpf?: string; // Obrigatório para saque no Brasil
  whatsapp: string;
  pais: string;
  
  // Dados Bancários (Para Saque)
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: 'corrente' | 'poupanca';
  
  // PIX (Alternativo para Brasil)
  chave_pix?: string;
  tipo_pix?: 'cpf' | 'email' | 'telefone' | 'aleatoria';
  
  // Validação
  dados_validados: boolean;
  validado_em?: Date;
  validado_por?: number; // ID do admin que validou
  
  // Configurações Enterprise
  limite_saque_diario?: number;
  limite_operacao?: number;
  features_habilitadas?: string[];
  
  // Controle
  created_at?: Date;
  updated_at?: Date;
}

// Configurações específicas por perfil
export interface ProfileConfig {
  profile: UserProfile;
  displayName: string;
  description: string;
  features: string[];
  limits: {
    maxDailyWithdrawal: number;
    maxOperationAmount: number;
    maxConcurrentTrades: number;
  };
  requiredFields: string[];
  smsTemplate: string;
  dashboardAccess: string[];
}

// Configurações Enterprise por perfil
export const PROFILE_CONFIGS: Record<UserProfile, ProfileConfig> = {
  [UserProfile.BASIC]: {
    profile: UserProfile.BASIC,
    displayName: 'Usuário Básico',
    description: 'Acesso básico ao sistema de trading',
    features: [
      'Trading automatizado',
      'Dashboard básico',
      'Suporte por email',
      'Relatórios mensais'
    ],
    limits: {
      maxDailyWithdrawal: 1000,
      maxOperationAmount: 500,
      maxConcurrentTrades: 2
    },
    requiredFields: ['nome_completo', 'whatsapp', 'pais'],
    smsTemplate: 'Bem-vindo ao CoinBitClub! Código: {code}',
    dashboardAccess: ['trading', 'operations', 'profile']
  },
  
  [UserProfile.PREMIUM]: {
    profile: UserProfile.PREMIUM,
    displayName: 'Usuário Premium',
    description: 'Acesso avançado com recursos premium',
    features: [
      'Trading automatizado 24/7',
      'Dashboard avançado',
      'Suporte prioritário',
      'Relatórios em tempo real',
      'Analytics avançados',
      'Notificações personalizadas'
    ],
    limits: {
      maxDailyWithdrawal: 5000,
      maxOperationAmount: 2000,
      maxConcurrentTrades: 5
    },
    requiredFields: ['nome_completo', 'whatsapp', 'pais', 'cpf'],
    smsTemplate: '🎯 Bem-vindo Premium! Seu código: {code}',
    dashboardAccess: ['trading', 'operations', 'profile', 'analytics', 'reports']
  },
  
  [UserProfile.ENTERPRISE]: {
    profile: UserProfile.ENTERPRISE,
    displayName: 'Usuário Enterprise',
    description: 'Solução corporativa com recursos completos',
    features: [
      'Trading institucional',
      'Dashboard executivo',
      'Suporte dedicado 24/7',
      'Relatórios customizados',
      'API avançada',
      'Multi-usuários',
      'Compliance completo'
    ],
    limits: {
      maxDailyWithdrawal: 50000,
      maxOperationAmount: 20000,
      maxConcurrentTrades: 10
    },
    requiredFields: ['nome_completo', 'whatsapp', 'pais', 'cpf', 'banco', 'conta'],
    smsTemplate: '🏢 Cadastro Enterprise. Código: {code}',
    dashboardAccess: ['trading', 'operations', 'profile', 'analytics', 'reports', 'admin', 'compliance']
  },
  
  [UserProfile.AFFILIATE_NORMAL]: {
    profile: UserProfile.AFFILIATE_NORMAL,
    displayName: 'Afiliado Normal',
    description: 'Programa de afiliados com 1.5% de comissão',
    features: [
      'Trading automatizado',
      'Dashboard de afiliado',
      'Comissão 1.5% sobre lucros dos indicados',
      'Links de indicação',
      'Relatórios de comissão',
      'Sistema de saques'
    ],
    limits: {
      maxDailyWithdrawal: 2000,
      maxOperationAmount: 1000,
      maxConcurrentTrades: 3
    },
    requiredFields: ['nome_completo', 'whatsapp', 'pais', 'cpf', 'chave_pix'],
    smsTemplate: '🤝 Bem-vindo Afiliado! Código: {code}',
    dashboardAccess: ['trading', 'operations', 'profile', 'affiliate', 'commissions']
  },
  
  [UserProfile.AFFILIATE_VIP]: {
    profile: UserProfile.AFFILIATE_VIP,
    displayName: 'Afiliado VIP',
    description: 'Programa VIP com 5% de comissão (designação admin)',
    features: [
      'Trading automatizado premium',
      'Dashboard VIP de afiliado',
      'Comissão 5% sobre lucros dos indicados',
      'Links personalizados',
      'Relatórios avançados',
      'Pagamentos prioritários',
      'Suporte dedicado'
    ],
    limits: {
      maxDailyWithdrawal: 10000,
      maxOperationAmount: 5000,
      maxConcurrentTrades: 7
    },
    requiredFields: ['nome_completo', 'whatsapp', 'pais', 'cpf', 'banco', 'conta'],
    smsTemplate: '💎 Bem-vindo Afiliado VIP! Código: {code}',
    dashboardAccess: ['trading', 'operations', 'profile', 'affiliate', 'commissions', 'vip-tools']
  },
  
  [UserProfile.ADMIN]: {
    profile: UserProfile.ADMIN,
    displayName: 'Administrador',
    description: 'Acesso completo ao sistema',
    features: [
      'Gestão completa de usuários',
      'Configuração de planos',
      'Gestão de afiliados',
      'Relatórios financeiros',
      'Configurações do sistema',
      'Auditoria completa'
    ],
    limits: {
      maxDailyWithdrawal: 100000,
      maxOperationAmount: 50000,
      maxConcurrentTrades: 20
    },
    requiredFields: ['nome_completo', 'whatsapp'],
    smsTemplate: '👑 Acesso Admin. Código: {code}',
    dashboardAccess: ['*'] // Acesso total
  }
};

// Funções utilitárias para profiles
export function getProfileConfig(profile: UserProfile): ProfileConfig {
  return PROFILE_CONFIGS[profile];
}

export function getProfileDisplayName(profile: UserProfile): string {
  return PROFILE_CONFIGS[profile].displayName;
}

export function getProfileFeatures(profile: UserProfile): string[] {
  return PROFILE_CONFIGS[profile].features;
}

export function getProfileLimits(profile: UserProfile) {
  return PROFILE_CONFIGS[profile].limits;
}

export function getRequiredFields(profile: UserProfile): string[] {
  return PROFILE_CONFIGS[profile].requiredFields;
}

export function getSmsTemplate(profile: UserProfile): string {
  return PROFILE_CONFIGS[profile].smsTemplate;
}

export function hasAccess(profile: UserProfile, feature: string): boolean {
  const access = PROFILE_CONFIGS[profile].dashboardAccess;
  return access.includes('*') || access.includes(feature);
}

// Validação de dados do perfil
export function validateProfileData(data: Partial<UserProfileData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.profile_type) {
    errors.push('Tipo de perfil é obrigatório');
  }
  
  if (!data.nome_completo || data.nome_completo.length < 3) {
    errors.push('Nome completo é obrigatório (mínimo 3 caracteres)');
  }
  
  if (!data.whatsapp) {
    errors.push('WhatsApp é obrigatório');
  }
  
  if (!data.pais) {
    errors.push('País é obrigatório');
  }
  
  // Validações específicas por perfil
  if (data.profile_type) {
    const requiredFields = getRequiredFields(data.profile_type);
    
    requiredFields.forEach(field => {
      if (!data[field as keyof UserProfileData]) {
        errors.push(`${field} é obrigatório para o perfil ${getProfileDisplayName(data.profile_type!)}`);
      }
    });
  }
  
  // Validação de CPF (Brasil)
  if (data.cpf && data.pais === 'BR') {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(data.cpf)) {
      errors.push('CPF deve estar no formato XXX.XXX.XXX-XX');
    }
  }
  
  // Validação de WhatsApp
  if (data.whatsapp) {
    const whatsappRegex = /^\+\d{10,15}$/;
    if (!whatsappRegex.test(data.whatsapp)) {
      errors.push('WhatsApp deve estar no formato +5511999999999');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Interface para estatísticas de perfil
export interface ProfileStats {
  profile: UserProfile;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  avgMonthlyRevenue: number;
  topFeatures: string[];
}

// Configurações de migração de perfil
export interface ProfileMigration {
  from: UserProfile;
  to: UserProfile;
  requiredApproval: boolean;
  additionalRequirements: string[];
  migrationFee?: number;
}

export const PROFILE_MIGRATIONS: ProfileMigration[] = [
  {
    from: UserProfile.BASIC,
    to: UserProfile.PREMIUM,
    requiredApproval: false,
    additionalRequirements: ['cpf'],
    migrationFee: 0
  },
  {
    from: UserProfile.PREMIUM,
    to: UserProfile.ENTERPRISE,
    requiredApproval: true,
    additionalRequirements: ['banco', 'conta', 'validacao_compliance'],
    migrationFee: 0
  },
  {
    from: UserProfile.BASIC,
    to: UserProfile.AFFILIATE_NORMAL,
    requiredApproval: false,
    additionalRequirements: ['cpf', 'chave_pix'],
    migrationFee: 0
  },
  {
    from: UserProfile.AFFILIATE_NORMAL,
    to: UserProfile.AFFILIATE_VIP,
    requiredApproval: true,
    additionalRequirements: ['min_10_referrals', 'min_monthly_volume_5000'],
    migrationFee: 0
  }
];

export default {
  UserProfile,
  PROFILE_CONFIGS,
  getProfileConfig,
  getProfileDisplayName,
  getProfileFeatures,
  getProfileLimits,
  getRequiredFields,
  getSmsTemplate,
  hasAccess,
  validateProfileData,
  PROFILE_MIGRATIONS
};
