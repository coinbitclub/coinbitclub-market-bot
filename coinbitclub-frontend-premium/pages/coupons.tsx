import { useState } from 'react';
import Head from 'next/head';
import { FiGift, FiCheck, FiAlertCircle, FiLoader, FiCopy, FiX, FiArrowLeft, FiInfo, FiHelpCircle } from 'react-icons/fi';
import { MobileCard, MobileInput, MobileButton, MobileAlert } from '../components/mobile/MobileComponents';

export default function CouponsPage() {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      alert('Digite o código do cupom');
      return;
    }

    setLoading(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setValidationResult(data.coupon);
      } else {
        alert(data.message || 'Cupom inválido');
        setValidationResult(null);
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      alert('Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!validationResult) return;

    setLoading(true);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: couponCode,
          userId: 'current_user_id' // TODO: Pegar do contexto de autenticação
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setCouponCode('');
        setValidationResult(null);
        
        // Auto-hide success message
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        alert(data.message || 'Erro ao aplicar cupom');
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      alert('Erro ao aplicar cupom');
    } finally {
      setLoading(false);
    }
  };

  const pasteCoupon = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCouponCode(text.toUpperCase());
    } catch (error) {
      console.error('Erro ao colar texto:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Cupons de Crédito | CoinBitClub</title>
        <meta name="description" content="Aplique cupons de crédito na sua conta CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30 px-4 py-4 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-yellow-400 hover:text-pink-400 transition-colors"
              aria-label="Voltar"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-yellow-400">Cupons de Crédito</h1>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <FiGift className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold text-yellow-400">⚡ Cupons de Crédito</h1>
                <p className="text-blue-400">Aplique cupons e ganhe créditos para suas operações</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message - Mobile Optimized */}
        {showSuccess && (
          <div className="fixed top-20 left-4 right-4 lg:top-4 lg:left-auto lg:right-4 lg:w-auto z-50 bg-green-400/20 border border-green-400/50 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <FiCheck className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-400 font-bold">Cupom aplicado com sucesso!</p>
                <p className="text-green-400 text-sm">Créditos adicionados à sua conta</p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="text-green-400 hover:text-green-300 p-1"
                aria-label="Fechar"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content - Mobile Optimized */}
        <div className="max-w-6xl mx-auto p-4 lg:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Aplicar Cupom */}
            <MobileCard className="order-1">
              <h2 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                <FiGift className="w-6 h-6 mr-2" />
                Aplicar Cupom
              </h2>

              <div className="space-y-6">
                <div>
                  <MobileInput
                    label="Código do Cupom"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="CBC12345678"
                    maxLength={20}
                    className="uppercase"
                  />
                  <div className="flex mt-3">
                    <MobileButton
                      variant="secondary"
                      size="sm"
                      onClick={pasteCoupon}
                      icon={<FiCopy className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Colar
                    </MobileButton>
                  </div>
                </div>

                <MobileButton
                  fullWidth
                  onClick={validateCoupon}
                  loading={loading}
                  disabled={!couponCode.trim()}
                  icon={!loading && <FiCheck className="w-5 h-5" />}
                >
                  {loading ? 'Validando...' : 'Validar Cupom'}
                </MobileButton>
                </button>

                {/* Resultado da Validação */}
                {validationResult && (
                  <div className="bg-green-400/10 border border-green-400/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <FiCheck className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-bold">Cupom Válido!</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-400">Código:</span>
                        <span className="text-yellow-400 font-bold">{validationResult.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Valor:</span>
                        <span className="text-green-400 font-bold">
                          ${validationResult.amount.toFixed(2)} {validationResult.currency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Descrição:</span>
                        <span className="text-yellow-400">{validationResult.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Tipo:</span>
                        <span className="text-pink-400">
                          {validationResult.type === 'single_use' ? 'Uso Único' : 
                           validationResult.type === 'multi_use' ? 'Múltiplo Uso' : 'Ilimitado'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={applyCoupon}
                      disabled={loading}
                      className="w-full mt-4 px-6 py-3 text-black bg-green-400 hover:bg-green-300 disabled:bg-green-400/50 disabled:cursor-not-allowed border-2 border-green-400 rounded-lg transition-all duration-300 font-bold flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <FiLoader className="w-5 h-5 mr-2 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <FiGift className="w-5 h-5 mr-2" />
                          Aplicar Cupom
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Informações */}
            <div className="space-y-6">
              {/* Como Funciona */}
              <div className="bg-black/90 backdrop-blur-sm border-2 border-blue-400/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4">Como Funciona</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400 font-bold">1.</span>
                    <span className="text-blue-400">Digite ou cole o código do cupom</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400 font-bold">2.</span>
                    <span className="text-blue-400">Clique em "Validar Cupom" para verificar</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400 font-bold">3.</span>
                    <span className="text-blue-400">Se válido, clique em "Aplicar Cupom"</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400 font-bold">4.</span>
                    <span className="text-blue-400">Créditos serão adicionados à sua conta</span>
                  </div>
                </div>
              </div>

              {/* Importante */}
              <div className="bg-orange-400/10 border border-orange-400/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center">
                  <FiAlertCircle className="w-5 h-5 mr-2" />
                  Importante
                </h3>
                <div className="space-y-2 text-sm text-orange-400">
                  <p>• Cupons só podem ser usados uma vez por conta</p>
                  <p>• Créditos de cupons não geram direito a saque</p>
                  <p>• Use os créditos apenas para operações na plataforma</p>
                  <p>• Verifique a data de validade do cupom</p>
                  <p>• Códigos são case-insensitive (maiúsculas/minúsculas)</p>
                </div>
              </div>

              {/* Suporte */}
              <div className="bg-black/90 backdrop-blur-sm border-2 border-pink-400/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-pink-400 mb-4">Precisa de Ajuda?</h3>
                <p className="text-blue-400 text-sm mb-4">
                  Se você está com problemas para aplicar um cupom, entre em contato conosco.
                </p>
                <button className="w-full px-4 py-2 text-black bg-pink-400 hover:bg-pink-300 border-2 border-pink-400 rounded-lg transition-all duration-300 font-bold">
                  Contatar Suporte
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 bg-black/90 backdrop-blur-sm border-t border-yellow-400/30 p-4 text-center">
          <p className="text-yellow-400 text-sm font-bold">⚡ Cupons de Crédito - CoinBitClub ⚡</p>
        </div>
      </div>
    </>
  );
}
