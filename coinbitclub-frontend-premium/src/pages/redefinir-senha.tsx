import React from 'react';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiLock, FiEye, FiEyeOff, FiLoader, FiCheck, FiAlertTriangle } from 'react-icons/fi';

export default function RedefinirSenha() {
  const router = useRouter();
  const { token } = router.query;
  
  const [novaSenha, setNovaSenha] = useState(');'
  const [confirmarSenha, setConfirmarSenha] = useState(');'
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  // Validar token ao carregar a página
  useEffect(() => {
    if (token) {
      validarToken();
    }
  }, [token]);

  const validarToken = async () => {
    try {
      const response = await fetch('/api/auth/validar-token', {'
        method: 'POST','
        headers: {
          'Content-Type': 'application/json','
        },
        body: JSON.stringify({ token }),
      });

      setTokenValido(response.ok);
    } catch (err) {
      setTokenValido(false);
    }
  };

  const validarSenha = (senha: string) => {
    const requisitos = {
      tamanho: senha.length >= 8,
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /\d/.test(senha),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(senha),"
    };

    return requisitos;
  };

  const requisitos = validarSenha(novaSenha);
  const senhaValida = Object.values(requisitos).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      // Validações
      if (!novaSenha) {
        throw new Error('Por favor, insira uma nova senha');'
      }

      if (!senhaValida) {
        throw new Error('A senha não atende aos requisitos de segurança');'
      }

      if (novaSenha !== confirmarSenha) {
        throw new Error('As senhas não coincidem');'
      }

      // Enviar para o backend
      const response = await fetch('/api/auth/redefinir-senha', {'
        method: 'POST','
        headers: {
          'Content-Type': 'application/json','
        },
        body: JSON.stringify({
          token,
          novaSenha,
          confirmarSenha,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao redefinir senha');'
      }

      setSucesso(true);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Token inválido ou expirado
  if (tokenValido === false) {
    return (
      <>
        <Head>
          <title>Link Expirado - CoinbitClub MarketBot</title>
          <link rel="icon" href="/favicon.ico" />"
        </Head>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">"
          <div className="relative flex min-h-screen items-center justify-center p-8">"
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10"></div>"
            
            <div className="relative z-10 w-full max-w-md">"
              <div className="premium-card text-center">"
                <div className="mb-6 flex justify-center">"
                  <div className="flex size-16 items-center justify-center rounded-full bg-red-500/20">"
                    <FiAlertTriangle className="size-8 text-red-400" />"
                  </div>
                </div>
                <h1 className="mb-4 text-2xl font-bold text-white">"
                  Link Expirado
                </h1>
                <p className="mb-6 text-slate-300">"
                  Este link de recuperação de senha expirou ou é inválido.
                </p>
                <div className="space-y-3">"
                  <Link
                    href="/esqueci-senha"
                    className="premium-button block w-full rounded-xl px-4 py-3 text-center"
                  >
                    Solicitar Novo Link
                  </Link>
                  <Link
                    href="/auth"
                    className="block w-full rounded-xl border-2 border-slate-600 px-4 py-3 text-center text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-400"
                  >
                    Voltar ao Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Redefinir Senha - CoinbitClub MarketBot</title>
        <meta
          name="description"
          content="Crie uma nova senha para sua conta CoinbitClub MarketBot Premium"
        />
        <link rel="icon" href="/favicon.ico" />"
      </Head>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">"
        <div className="relative flex min-h-screen items-center justify-center p-8">"
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10"></div>"
          <div className="absolute left-1/4 top-1/4 size-96 animate-pulse rounded-full bg-emerald-500/20 blur-3xl"></div>"
          <div className="absolute bottom-1/4 right-1/4 size-96 animate-pulse rounded-full bg-teal-500/20 blur-3xl delay-1000"></div>"

          {/* Card Principal */}
          <div className="relative z-10 w-full max-w-md">"
            <div className="premium-card">"
              {sucesso ? (
                /* Tela de Sucesso */
                <div className="text-center">"
                  <div className="mb-6 flex justify-center">"
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20">"
                      <FiCheck className="size-8 text-emerald-400" />"
                    </div>
                  </div>
                  <h2 className="mb-4 text-xl font-semibold text-emerald-400">"
                    Senha Redefinida!
                  </h2>
                  <p className="mb-8 text-slate-300">"
                    Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
                  </p>
                  <Link
                    href="/auth"
                    className="premium-button w-full rounded-xl px-4 py-3 text-center"
                  >
                    Fazer Login
                  </Link>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-8 text-center">"
                    <div className="mb-4 flex justify-center">"
                      <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500">"
                        <FiLock className="size-8 text-black" />"
                      </div>
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-white">"
                      Redefinir Senha
                    </h1>
                    <p className="text-slate-400">"
                      Crie uma nova senha segura para sua conta
                    </p>
                  </div>

                  {/* Formulário */}
                  <form onSubmit={handleSubmit} className="space-y-6">"
                    {/* Nova Senha */}
                    <div>
                      <label htmlFor="novaSenha" className="mb-2 block text-sm font-medium text-slate-300">"
                        Nova Senha
                      </label>
                      <div className="relative">"
                        <input
                          id="novaSenha"
                          type={mostrarSenha ? 'text' : 'password'}'
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          className="premium-input w-full pr-10"
                          placeholder="Digite sua nova senha"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
                        >
                          {mostrarSenha ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}"
                        </button>
                      </div>
                    </div>

                    {/* Confirmar Senha */}
                    <div>
                      <label htmlFor="confirmarSenha" className="mb-2 block text-sm font-medium text-slate-300">"
                        Confirmar Nova Senha
                      </label>
                      <div className="relative">"
                        <input
                          id="confirmarSenha"
                          type={mostrarConfirmacao ? 'text' : 'password'}'
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                          className="premium-input w-full pr-10"
                          placeholder="Digite novamente sua nova senha"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
                        >
                          {mostrarConfirmacao ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}"
                        </button>
                      </div>
                    </div>

                    {/* Requisitos de Senha */}
                    {novaSenha && (
                      <div className="space-y-2">"
                        <p className="text-sm font-medium text-slate-300">Requisitos da senha:</p>"
                        <div className="space-y-1">"
                          {[
                            { key: 'tamanho', text: 'Pelo menos 8 caracteres' },'
                            { key: 'maiuscula', text: 'Uma letra maiúscula' },'
                            { key: 'minuscula', text: 'Uma letra minúscula' },'
                            { key: 'numero', text: 'Um número' },'
                            { key: 'especial', text: 'Um caractere especial' },'
                          ].map((req) => (
                            <div key={req.key} className="flex items-center text-xs">"
                              <div
                                className={`mr-2 size-2 rounded-full ${
                                  requisitos[req.key as keyof typeof requisitos]
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-600'
                                }`}
                              />
                              <span
                                className={
                                  requisitos[req.key as keyof typeof requisitos]
                                    ? 'text-emerald-400'
                                    : 'text-slate-500'
                                }
                              >
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verificação de Confirmação */}
                    {confirmarSenha && (
                      <div className="flex items-center text-xs">"
                        <div
                          className={`mr-2 size-2 rounded-full ${
                            novaSenha === confirmarSenha ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={
                            novaSenha === confirmarSenha ? 'text-emerald-400' : 'text-red-400'
                          }
                        >
                          {novaSenha === confirmarSenha ? 'Senhas coincidem' : 'Senhas não coincidem'}'
                        </span>
                      </div>
                    )}

                    {erro && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">"
                        {erro}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !senhaValida || novaSenha !== confirmarSenha}
                      className="premium-button w-full rounded-xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">"
                          <FiLoader className="mr-2 size-4 animate-spin" />"
                          Redefinindo...
                        </div>
                      ) : (
                        'Redefinir Senha'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Links Adicionais */}
            <div className="mt-6 text-center">"
              <p className="text-sm text-slate-500">"
                Lembrou da senha?{' '}'
                <Link href="/auth" className="text-emerald-400 hover:text-emerald-300">"
                  Fazer Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



