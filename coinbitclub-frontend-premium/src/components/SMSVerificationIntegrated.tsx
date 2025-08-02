// ============================================================================
// 📱 COMPONENTE SMS VERIFICATION INTEGRADO - SEM DADOS MOCK
// ============================================================================
// Componente de verificação SMS 100% integrado com backend
// API Railway: https://coinbitclub-market-bot.up.railway.app
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  FiSmartphone, 
  FiRefreshCw, 
  FiArrowLeft,
  FiCheck,
  FiAlertTriangle 
} from 'react-icons/fi';

// 📱 Interface do componente
interface SMSVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
}

interface SMSState {
  code: string;
  loading: boolean;
  error: string;
  success: string;
  countdown: number;
  canResend: boolean;
}

export const SMSVerificationComponent: React.FC<SMSVerificationProps> = ({
  phoneNumber,
  onVerified,
  onBack,
  title = "Verificação SMS",
  subtitle = "Digite o código enviado para seu telefone"
}) => {
  const [state, setState] = useState<SMSState>({
    code: '',
    loading: false,
    error: '',
    success: '',
    countdown: 60,
    canResend: false
  });

  // 🔄 Countdown para reenvio
  useEffect(() => {
    if (state.countdown > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          countdown: prev.countdown - 1,
          canResend: prev.countdown === 1
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.countdown]);

  // 🎯 Auto-submit quando código estiver completo
  useEffect(() => {
    if (state.code.length === 6) {
      handleVerifyCode();
    }
  }, [state.code]);

  // 📱 Função de verificação
  const handleVerifyCode = async () => {
    if (state.code.length !== 6) {
      setState(prev => ({ ...prev, error: 'Código deve ter 6 dígitos' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const response = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          code: state.code
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({ ...prev, success: 'SMS verificado com sucesso!' }));
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.message || 'Código inválido. Tente novamente.',
          code: '' // Limpar código para nova tentativa
        }));
      }
    } catch (error: any) {
      console.error('❌ SMS verification error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro de conexão. Tente novamente.',
        code: ''
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 📤 Função de reenvio
  const handleResendCode = async () => {
    setState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const response = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          success: 'Novo código enviado!',
          countdown: 60,
          canResend: false,
          code: ''
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.message || 'Erro ao reenviar código'
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Erro de conexão. Tente novamente.'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 🎨 Formatação do telefone
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiSmartphone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 mb-2">{subtitle}</p>
        <p className="text-sm text-gray-500">
          Código enviado para: <span className="text-blue-400 font-medium">{formatPhone(phoneNumber)}</span>
        </p>
      </div>

      {/* Messages */}
      {state.error && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 flex items-center">
          <FiAlertTriangle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
          <span className="text-red-400 text-sm">{state.error}</span>
        </div>
      )}

      {state.success && (
        <div className="bg-green-900/50 border border-green-600 rounded-lg p-4 flex items-center">
          <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
          <span className="text-green-400 text-sm">{state.success}</span>
        </div>
      )}

      {/* Code Input */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300 text-center">
          Código de Verificação
        </label>
        
        <div className="flex justify-center">
          <input
            type="text"
            value={state.code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setState(prev => ({ ...prev, code: value, error: '' }));
            }}
            placeholder="000000"
            disabled={state.loading}
            className="w-48 text-center text-2xl font-bold py-4 px-4 border border-gray-600 placeholder-gray-400 text-white rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 tracking-widest"
            maxLength={6}
            autoComplete="one-time-code"
          />
        </div>

        <p className="text-xs text-gray-500 text-center">
          Digite os 6 dígitos recebidos por SMS
        </p>
      </div>

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="text-gray-400">Verificando código...</span>
        </div>
      )}

      {/* Resend Button */}
      <div className="text-center">
        {state.canResend ? (
          <button
            onClick={handleResendCode}
            disabled={state.loading}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center justify-center mx-auto disabled:opacity-50"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Reenviar Código
          </button>
        ) : (
          <p className="text-gray-500 text-sm">
            Reenviar código em {state.countdown}s
          </p>
        )}
      </div>

      {/* Manual Verify Button (se não auto-enviou) */}
      {state.code.length === 6 && !state.loading && (
        <button
          onClick={handleVerifyCode}
          disabled={state.loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {state.loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verificando...
            </>
          ) : (
            <>
              <FiCheck className="w-5 h-5 mr-2" />
              Verificar Código
            </>
          )}
        </button>
      )}

      {/* Back Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={onBack}
          disabled={state.loading}
          className="w-full py-2 px-4 text-gray-400 hover:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Login
        </button>
      </div>
    </div>
  );
};


