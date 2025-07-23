import { useState, useEffect } from 'react';
import Head from 'next/head';
import { CogIcon, ShieldCheckIcon, BellIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SimpleSettings() {
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoTrade, setAutoTrade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: 'João Silva',
    email: 'joao@coinbitclub.com',
    phone: '+55 11 99999-9999',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de salvamento
    alert('Configurações salvas com sucesso!');
  };

  return (
    <>
      <Head>
        <title>Configurações - CoinBitClub MarketBot</title>
        <meta name="description" content="Configurações do sistema CoinBitClub MarketBot" />
      </Head>

      <div className="min-h-screen bg-gray-900 p-6 text-white">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-2 flex items-center space-x-3">
            <CogIcon className="size-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
          </div>
          <p className="text-gray-400">Gerencie suas preferências e configurações da conta</p>
        </div>

        <div className="mx-auto max-w-6xl space-y-8">
          {/* Informações Pessoais */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-6 flex items-center space-x-3">
              <UserIcon className="size-6 text-cyan-400" />
              <h2 className="text-xl font-semibold">Informações Pessoais</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-cyan-600"
              >
                Salvar Informações
              </button>
            </form>
          </div>

          {/* Segurança */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-6 flex items-center space-x-3">
              <ShieldCheckIcon className="size-6 text-cyan-400" />
              <h2 className="text-xl font-semibold">Segurança</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 pr-12 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="size-5" />
                    ) : (
                      <EyeIcon className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Digite a nova senha"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-cyan-600"
              >
                Alterar Senha
              </button>
            </form>

            {/* 2FA */}
            <div className="mt-8 border-t border-gray-700 pt-6">
              <h3 className="mb-4 text-lg font-medium">Autenticação de Dois Fatores (2FA)</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300">Adicione uma camada extra de segurança à sua conta</p>
                  <p className="text-sm text-gray-400">Status: <span className="text-red-400">Desativado</span></p>
                </div>
                <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-700">
                  Ativar 2FA
                </button>
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-6 flex items-center space-x-3">
              <BellIcon className="size-6 text-cyan-400" />
              <h2 className="text-xl font-semibold">Notificações</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Notificações por Email</h3>
                  <p className="text-gray-400">Receba alertas de trades e relatórios por email</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Notificações por SMS</h3>
                  <p className="text-gray-400">Receba alertas críticos via SMS</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Configurações de Trading */}
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-6 flex items-center space-x-3">
              <CogIcon className="size-6 text-cyan-400" />
              <h2 className="text-xl font-semibold">Configurações de Trading</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Trading Automático</h3>
                  <p className="text-gray-400">Permitir que o bot execute trades automaticamente</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoTrade}
                    onChange={(e) => setAutoTrade(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Limite de Risco (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue="5"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Valor Máximo por Trade (USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    defaultValue="1000"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <button className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-cyan-600">
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
