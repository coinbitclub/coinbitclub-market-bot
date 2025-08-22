// ========================================
// MARKETBOT - USER TYPES AND INTERFACES
// ========================================

export enum UserType {
  ADMIN = 'ADMIN',
  GESTOR = 'GESTOR',
  OPERADOR = 'OPERADOR',
  AFFILIATE_VIP = 'AFFILIATE_VIP',
  AFFILIATE = 'AFFILIATE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum PlanType {
  MONTHLY = 'MONTHLY',
  PREPAID = 'PREPAID',
  NONE = 'NONE',
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
}

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_UPDATE = 'USER_UPDATE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',
  FAILED_LOGIN = 'FAILED_LOGIN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  BALANCE_UPDATE = 'BALANCE_UPDATE',
  WITHDRAWAL_REQUEST = 'WITHDRAWAL_REQUEST',
  WITHDRAWAL_APPROVED = 'WITHDRAWAL_APPROVED',
  COMMISSION_PAID = 'COMMISSION_PAID',
}

// ========================================
// USER INTERFACES
// ========================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  countryCode: string;
  userType: UserType;
  status: UserStatus;
  planType: PlanType;
  
  // Saldos financeiros
  balanceRealBrl: number;
  balanceRealUsd: number;
  balanceAdminBrl: number;
  balanceAdminUsd: number;
  balanceCommissionBrl: number;
  balanceCommissionUsd: number;
  
  // Configurações de trading
  maxConcurrentPositions: number;
  dailyLossLimitUsd: number;
  maxPositionSizePercent: number;
  defaultLeverage: number;
  defaultStopLossMultiplier: number;
  defaultTakeProfitMultiplier: number;
  
  // Verificações
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Dados bancários
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  bankCpf?: string;
  pixKey?: string;
  pixType?: string;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockedUntil?: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  planType: PlanType;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastLoginAt: Date | undefined;
  
  // Saldos (sem dados sensíveis)
  balanceRealBrl: number;
  balanceRealUsd: number;
  balanceAdminBrl: number;
  balanceAdminUsd: number;
  balanceCommissionBrl: number;
  balanceCommissionUsd: number;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  countryCode?: string;
  referralCode?: string | undefined;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  bankCpf?: string;
  pixKey?: string;
  pixType?: string;
}

export interface UpdateUserSettingsDTO {
  maxConcurrentPositions?: number;
  dailyLossLimitUsd?: number;
  maxPositionSizePercent?: number;
  defaultLeverage?: number;
  defaultStopLossMultiplier?: number;
  defaultTakeProfitMultiplier?: number;
}

// ========================================
// AFFILIATE INTERFACES
// ========================================

export interface Affiliate {
  id: string;
  userId: string;
  affiliateCode: string;
  referralCodeUsed?: string;
  referredByUserId?: string;
  commissionRate: number;
  status: string;
  totalReferrals: number;
  totalEarningsBrl: number;
  totalEarningsUsd: number;
  pendingPaymentsBrl: number;
  pendingPaymentsUsd: number;
  totalPaidBrl: number;
  totalPaidUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAffiliateDTO {
  userId: string;
  commissionRate: number;
}

// ========================================
// SESSION INTERFACES
// ========================================

export interface UserSession {
  id: string;
  userId: string;
  refreshToken: string;
  accessTokenJti: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  isRevoked: boolean;
}

export interface CreateSessionDTO {
  userId: string;
  refreshToken: string;
  accessTokenJti: string;
  ipAddress?: string;
  userAgent?: string;
  expiresIn: number; // seconds
}

// ========================================
// VERIFICATION TOKEN INTERFACES
// ========================================

export interface VerificationToken {
  id: string;
  userId: string;
  token: string;
  tokenType: TokenType;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface CreateVerificationTokenDTO {
  userId: string;
  tokenType: TokenType;
  expiresIn: number; // seconds
}

// ========================================
// AUDIT LOG INTERFACES
// ========================================

export interface AuditLog {
  id: string;
  userId?: string;
  action: AuditAction;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogDTO {
  userId?: string;
  action: AuditAction;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ========================================
// AUTHENTICATION INTERFACES
// ========================================

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string | undefined;
}

export interface LoginResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RegisterRequest extends CreateUserDTO {}

export interface RegisterResponse {
  user: PublicUser;
  message: string;
  verificationRequired: boolean;
}

export interface VerifyEmailRequest {
  token: string;
  email: string;
}

export interface VerifyPhoneRequest {
  token: string;
  phone: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ========================================
// JWT PAYLOAD INTERFACES
// ========================================

export interface JWTPayload {
  sub: string; // user id
  email: string;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  iat: number;
  exp: number;
  jti: string; // JWT ID
}

export interface RefreshTokenPayload {
  sub: string; // user id
  sessionId: string;
  iat: number;
  exp: number;
}

// ========================================
// PERMISSION INTERFACES
// ========================================

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  [UserType.ADMIN]: Permission[];
  [UserType.GESTOR]: Permission[];
  [UserType.OPERADOR]: Permission[];
  [UserType.AFFILIATE_VIP]: Permission[];
  [UserType.AFFILIATE]: Permission[];
}

// ========================================
// API RESPONSE INTERFACES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  statusCode: number;
}

// ========================================
// USER STATISTICS INTERFACES
// ========================================

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  totalAffiliates: number;
  vipAffiliates: number;
  monthlySubscribers: number;
  prepaidUsers: number;
  totalBalanceBrl: number;
  totalBalanceUsd: number;
  avgLoginAttempts: number;
}

export interface UserWithAffiliate extends PublicUser {
  affiliateCode?: string;
  commissionRate?: number;
  totalReferrals?: number;
  totalEarnings?: number;
  referredByName?: string;
}
