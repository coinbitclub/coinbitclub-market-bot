// ============================================================================
// 📱 COMPONENTE DE VERIFICAÇÃO SMS INTEGRADO
// ============================================================================
// Componente reutilizável para verificação SMS via Twilio
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import React, { useState, useEffect } from 'react';
import { FiPhone, FiRefreshCw, FiCheck } from 'react-icons/fi';

interface SmsVerificationProps {
  phone: string;
  onSuccess: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export const SmsVerification: React.FC<SmsVerificationProps> = ({
  phone,
  onSuccess,
  onResend,
  loading = false,
  title = "Verificação por SMS",
  subtitle = "Digite o código de 6 dígitos enviado para seu telefone"
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-submit quando código completo
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !isVerifying) {
      handleVerifyCode(fullCode);
    }
  }, [code, isVerifying]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Só aceita 1 dígito
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Focar próximo input automaticamente
    if (value && index < 5) {
      const nextInput = document.getElementById(`sms-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleBackspace = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`sms-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCode = async (fullCode: string) => {
    try {
      setIsVerifying(true);
      setError('');
      await onSuccess(fullCode);
    } catch (error: any) {
      setError(error.message || 'Código inválido');
      setCode(['', '', '', '', '', '']);
      // Focar primeiro input
      const firstInput = document.getElementById('sms-code-0');
      firstInput?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await onResend();
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Erro ao reenviar código');
    }
  };

  const maskPhone = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{5})(\d{4})$/);
    
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}****`;
    }
    
    return phoneNumber.slice(0, -4) + '****';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <FiPhone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-400 mb-4">{subtitle}</p>
            <div className="bg-gray-700 rounded-lg px-4 py-2 inline-block">
              <span className="text-blue-400 font-mono text-sm">{maskPhone(phone)}</span>
            </div>
          </div>

          {/* Código SMS */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Código de Verificação
            </label>
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`sms-code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleBackspace(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  disabled={loading || isVerifying}
                />
              ))}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Loading */}
          {(loading || isVerifying) && (
            <div className="mb-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">
                {isVerifying ? 'Verificando código...' : 'Enviando SMS...'}
              </span>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-4">
            {/* Status da verificação */}
            <div className="flex items-center justify-center text-sm text-gray-400">
              {code.join('').length === 6 && !isVerifying && (
                <div className="flex items-center text-green-400">
                  <FiCheck className="w-4 h-4 mr-1" />
                  Código completo - verificando...
                </div>
              )}
            </div>

            {/* Reenviar código */}
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading || isVerifying}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                {countdown > 0 
                  ? `Reenviar em ${countdown}s` 
                  : 'Reenviar código'
                }
              </button>
            </div>
          </div>

          {/* Ajuda */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Não recebeu o código?</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Verifique sua caixa de SMS</li>
                <li>• Aguarde até 2 minutos</li>
                <li>• Certifique-se de ter sinal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Protegido por verificação SMS via Twilio
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmsVerification;


