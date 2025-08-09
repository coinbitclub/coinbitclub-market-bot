// Utilitários de validação para formulários admin
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  min?: number;
  max?: number;
  email?: boolean;
  phone?: boolean;
  currency?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {};
  private errors: ValidationError[] = [];

  constructor(rules: Record<string, ValidationRule>) {
    this.rules = rules;
  }

  validate(data: Record<string, any>): { isValid: boolean; errors: ValidationError[] } {
    this.errors = [];

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];
      const error = this.validateField(field, value, rule);
      if (error) {
        this.errors.push(error);
      }
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }

  private validateField(field: string, value: any, rule: ValidationRule): ValidationError | null {
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      return { field, message: `${this.getFieldLabel(field)} é obrigatório` };
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) {
      return null;
    }

    // Email validation
    if (rule.email && !this.isValidEmail(value)) {
      return { field, message: `${this.getFieldLabel(field)} deve ser um email válido` };
    }

    // Phone validation
    if (rule.phone && !this.isValidPhone(value)) {
      return { field, message: `${this.getFieldLabel(field)} deve ser um telefone válido` };
    }

    // Currency validation
    if (rule.currency && !this.isValidCurrency(value)) {
      return { field, message: `${this.getFieldLabel(field)} deve ser um valor monetário válido` };
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return { field, message: `${this.getFieldLabel(field)} deve ter pelo menos ${rule.minLength} caracteres` };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { field, message: `${this.getFieldLabel(field)} deve ter no máximo ${rule.maxLength} caracteres` };
      }
    }

    // Number range validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return { field, message: `${this.getFieldLabel(field)} deve ser pelo menos ${rule.min}` };
      }
      if (rule.max !== undefined && value > rule.max) {
        return { field, message: `${this.getFieldLabel(field)} deve ser no máximo ${rule.max}` };
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return { field, message: `${this.getFieldLabel(field)} tem formato inválido` };
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return { field, message: customError };
      }
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Brazilian phone: 10-11 digits
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  private isValidCurrency(value: any): boolean {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      amount: 'Valor',
      description: 'Descrição',
      category: 'Categoria',
      date: 'Data',
      paymentMethod: 'Método de Pagamento',
      commission_rate: 'Taxa de Comissão',
      vipCommissionRate: 'Taxa VIP',
      password: 'Senha',
      confirmPassword: 'Confirmação de Senha',
      country: 'País',
      notes: 'Observações',
      apiKey: 'Chave da API',
      host: 'Servidor',
      port: 'Porta',
      user: 'Usuário',
      fromEmail: 'Email Remetente',
      fromName: 'Nome Remetente'
    };
    return labels[field] || field;
  }
}

// ====== VALIDADORES ESPECÍFICOS ======

// Validador para despesas
export const expenseValidator = new FormValidator({
  description: { required: true, minLength: 3, maxLength: 200 },
  amount: { required: true, min: 0.01, currency: true },
  category: { required: true },
  date: { required: true },
  paymentMethod: { required: true },
  status: { required: true },
  notes: { maxLength: 500 },
  subscriptionType: {
    custom: (value) => {
      if (value && !['monthly', 'quarterly', 'yearly'].includes(value)) {
        return 'Tipo de recorrência inválido';
      }
      return null;
    }
  }
});

// Validador para afiliados
export const affiliateValidator = new FormValidator({
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, email: true },
  phone: { phone: true },
  country: { maxLength: 50 },
  commission_rate: { 
    min: 0, 
    max: 50,
    custom: (value) => {
      if (value !== undefined && value !== null && (isNaN(value) || value < 0 || value > 50)) {
        return 'Taxa deve estar entre 0% e 50%';
      }
      return null;
    }
  },
  vipCommissionRate: { 
    min: 0, 
    max: 10,
    custom: (value) => {
      if (value !== undefined && value !== null && (isNaN(value) || value < 0 || value > 10)) {
        return 'Taxa VIP deve estar entre 0% e 10%';
      }
      return null;
    }
  }
});

// Validador para configurações de email
export const emailConfigValidator = new FormValidator({
  fromEmail: { required: true, email: true },
  fromName: { required: true, minLength: 2, maxLength: 50 },
  'smtp.host': { 
    required: true,
    custom: (value) => {
      if (value && !/^[a-zA-Z0-9.-]+$/.test(value)) {
        return 'Servidor SMTP inválido';
      }
      return null;
    }
  },
  'smtp.port': { 
    required: true,
    min: 1,
    max: 65535,
    custom: (value) => {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'Porta deve ser um número entre 1 e 65535';
      }
      return null;
    }
  },
  'smtp.user': { required: true, email: true },
  'smtp.password': { required: true, minLength: 1 },
  'sendgrid.apiKey': {
    custom: (value) => {
      if (value && !value.startsWith('SG.')) {
        return 'Chave da API SendGrid deve começar com SG.';
      }
      return null;
    }
  },
  'mailgun.domain': {
    custom: (value) => {
      if (value && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        return 'Domínio Mailgun inválido';
      }
      return null;
    }
  }
});

// Validador para configurações gerais
export const systemConfigValidator = new FormValidator({
  'general.siteName': { required: true, minLength: 2, maxLength: 100 },
  'general.adminEmail': { required: true, email: true },
  'general.timezone': { required: true },
  'security.sessionTimeout': { required: true, min: 5, max: 1440 },
  'security.passwordMinLength': { required: true, min: 6, max: 32 },
  'affiliate.defaultCommission': { required: true, min: 0, max: 50 },
  'affiliate.vipCommission': { required: true, min: 0, max: 10 },
  'affiliate.payoutThreshold': { required: true, min: 1 }
});

// ====== UTILITÁRIOS DE VALIDAÇÃO ======

// Sanitização de dados
export const sanitizeInput = (value: string): string => {
  return value
    .trim()
    .replace(/[<>'"]/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 1000); // Limita o tamanho
};

// Validação de arquivo
export const validateFile = (file: File, options: {
  maxSize?: number; // em bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): string | null => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  if (file.size > maxSize) {
    return `Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`;
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return `Extensão não permitida. Extensões aceitas: ${allowedExtensions.join(', ')}`;
    }
  }

  return null;
};

// Validação de data
export const validateDate = (date: string, options: {
  minDate?: Date;
  maxDate?: Date;
  futureOnly?: boolean;
  pastOnly?: boolean;
}): string | null => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  const now = new Date();
  
  if (options.futureOnly && dateObj <= now) {
    return 'Data deve ser no futuro';
  }

  if (options.pastOnly && dateObj >= now) {
    return 'Data deve ser no passado';
  }

  if (options.minDate && dateObj < options.minDate) {
    return `Data deve ser após ${options.minDate.toLocaleDateString('pt-BR')}`;
  }

  if (options.maxDate && dateObj > options.maxDate) {
    return `Data deve ser antes de ${options.maxDate.toLocaleDateString('pt-BR')}`;
  }

  return null;
};

// Validação de CPF/CNPJ
export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  return digit === parseInt(cpf.charAt(10));
};

export const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/\D/g, '');
  
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return digit === parseInt(cnpj.charAt(13));
};

// Hook para validação em tempo real
export const useFormValidation = (
  validator: FormValidator,
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void
) => {
  const validateForm = (data: Record<string, any>) => {
    const result = validator.validate(data);
    if (onValidationChange) {
      onValidationChange(result.isValid, result.errors);
    }
    return result;
  };

  const getFieldError = (field: string, errors: ValidationError[]): string | null => {
    const error = errors.find(e => e.field === field);
    return error ? error.message : null;
  };

  return {
    validateForm,
    getFieldError
  };
};
