// ========================================
// MARKETBOT - AUTHENTICATION VALIDATORS
// Zod schemas para validação de dados
// ========================================

import { z } from 'zod';
import { UserType, UserStatus, PlanType, TokenType } from '../types/auth.types';

// ========================================
// VALIDADORES BASE
// ========================================

export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(5, 'Email deve ter pelo menos 5 caracteres')
  .max(255, 'Email deve ter no máximo 255 caracteres')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha deve ter no máximo 128 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Senha deve conter: minúscula, maiúscula, número e caractere especial'
  );

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{10,14}$/, 'Telefone inválido')
  .optional();

export const nameSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
  .trim();

export const countryCodeSchema = z
  .string()
  .length(2, 'Código do país deve ter 2 caracteres')
  .regex(/^[A-Z]{2}$/, 'Código do país deve ser duas letras maiúsculas')
  .default('BR');

export const affiliateCodeSchema = z
  .string()
  .regex(/^CBC[A-Z0-9]{6}$/, 'Código de afiliado inválido (formato: CBCxxxxxx)')
  .optional();

export const tokenSchema = z
  .string()
  .regex(/^[0-9]{6}$/, 'Token deve ter 6 dígitos');

export const uuidSchema = z
  .string()
  .uuid('ID inválido');

// ========================================
// VALIDADORES DE USUÁRIO
// ========================================

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  countryCode: countryCodeSchema,
  referralCode: affiliateCodeSchema,
});

export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  bankName: z.string().max(100).optional(),
  bankAgency: z.string().max(10).optional(),
  bankAccount: z.string().max(20).optional(),
  bankAccountType: z.enum(['corrente', 'poupanca']).optional(),
  bankCpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  pixKey: z.string().max(100).optional(),
  pixType: z.enum(['cpf', 'email', 'phone', 'random']).optional(),
});

export const updateUserSettingsSchema = z.object({
  maxConcurrentPositions: z.number().int().min(1).max(5).optional(),
  dailyLossLimitUsd: z.number().positive().max(10000).optional(),
  maxPositionSizePercent: z.number().int().min(10).max(50).optional(),
  defaultLeverage: z.number().int().min(1).max(10).optional(),
  defaultStopLossMultiplier: z.number().min(1).max(5).optional(),
  defaultTakeProfitMultiplier: z.number().min(1).max(6).optional(),
});

export const updateUserTypeSchema = z.object({
  userType: z.nativeEnum(UserType),
  reason: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
});

// ========================================
// VALIDADORES DE AUTENTICAÇÃO
// ========================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
  twoFactorCode: z.string().regex(/^[0-9]{6}$/).optional(),
});

export const registerSchema = createUserSchema;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
  email: emailSchema,
});

export const verifyPhoneSchema = z.object({
  token: tokenSchema,
  phone: z.string().regex(/^\+?[1-9]\d{10,14}$/, 'Telefone inválido'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  email: emailSchema,
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: passwordSchema,
});

export const enable2FASchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const verify2FASchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'Código deve ter 6 dígitos'),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
  code: z.string().regex(/^[0-9]{6}$/, 'Código deve ter 6 dígitos'),
});

// ========================================
// VALIDADORES DE AFILIADO
// ========================================

export const createAffiliateSchema = z.object({
  userId: uuidSchema,
  commissionRate: z.number().refine(
    (val) => val === 1.5 || val === 5.0,
    'Taxa de comissão deve ser 1.5% ou 5%'
  ),
});

export const updateAffiliateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  reason: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
});

// ========================================
// VALIDADORES DE CONSULTA
// ========================================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val >= 1).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val >= 1 && val <= 100).default('20'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const userFilterSchema = z.object({
  userType: z.nativeEnum(UserType).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  planType: z.nativeEnum(PlanType).optional(),
  emailVerified: z.string().transform(val => val === 'true').optional(),
  phoneVerified: z.string().transform(val => val === 'true').optional(),
  twoFactorEnabled: z.string().transform(val => val === 'true').optional(),
  search: z.string().min(2).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  lastLoginAfter: z.string().datetime().optional(),
  lastLoginBefore: z.string().datetime().optional(),
});

export const auditLogFilterSchema = z.object({
  userId: uuidSchema.optional(),
  action: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ========================================
// VALIDADORES DE ADMIN
// ========================================

export const adminCreateUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  countryCode: countryCodeSchema,
  userType: z.nativeEnum(UserType),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING_VERIFICATION),
  planType: z.nativeEnum(PlanType).default(PlanType.NONE),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  balanceRealBrl: z.number().min(0).default(0),
  balanceRealUsd: z.number().min(0).default(0),
  balanceAdminBrl: z.number().min(0).default(0),
  balanceAdminUsd: z.number().min(0).default(0),
});

export const adminUpdateBalanceSchema = z.object({
  userId: uuidSchema,
  balanceType: z.enum(['real_brl', 'real_usd', 'admin_brl', 'admin_usd', 'commission_brl', 'commission_usd']),
  amount: z.number(),
  operation: z.enum(['add', 'subtract', 'set']),
  reason: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
});

export const adminBulkActionSchema = z.object({
  userIds: z.array(uuidSchema).min(1, 'Pelo menos um usuário deve ser selecionado'),
  action: z.enum(['activate', 'deactivate', 'suspend', 'verify_email', 'verify_phone']),
  reason: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
});

// ========================================
// VALIDADORES DE SEGURANÇA
// ========================================

export const ipAddressSchema = z.string().ip().optional();

export const userAgentSchema = z.string().max(500).optional();

export const sessionFilterSchema = z.object({
  userId: uuidSchema.optional(),
  ipAddress: ipAddressSchema,
  isRevoked: z.string().transform(val => val === 'true').optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateBalanceInput = z.infer<typeof adminUpdateBalanceSchema>;
export type AdminBulkActionInput = z.infer<typeof adminBulkActionSchema>;

// ========================================
// VALIDADORES CUSTOMIZADOS
// ========================================

export const validateStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  
  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecial
  );
};

export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(cpf.charAt(10));
};

export const validatePixKey = (key: string, type: string): boolean => {
  switch (type) {
    case 'cpf':
      return validateCPF(key);
    case 'email':
      return z.string().email().safeParse(key).success;
    case 'phone':
      return /^\+?[1-9]\d{10,14}$/.test(key);
    case 'random':
      return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key);
    default:
      return false;
  }
};
