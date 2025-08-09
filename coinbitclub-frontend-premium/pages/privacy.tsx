import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiCheck, FiShield, FiUser, FiDollarSign, FiUsers, FiLock, FiZap, FiCreditCard, FiLogOut, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';

const PrivacyPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Termos de Uso e Política de Privacidade - CoinbitClub MarketBot</title>
        <meta name="description" content="Termos de Uso e Política de Privacidade da plataforma CoinbitClub MarketBot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        lineHeight: '1.7',
      }}>
        {/* Header */}
        <header style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <Link href="/" style={{
            fontSize: '1.8rem',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #F59E0B, #EAB308)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <FiArrowLeft style={{ color: '#F59E0B' }} />
            ⚡ CoinBitClub MarketBot
          </Link>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/auth/login" style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '12px',
              border: '2px solid #3B82F6',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <FiUser />
              LOGIN
            </Link>
            <Link href="/auth/register" style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '12px',
              border: '2px solid #F59E0B',
              background: 'linear-gradient(135deg, #F59E0B, #EAB308)',
              color: '#000',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <FiCheck />
              CADASTRAR
            </Link>
          </div>
        </header>

        {/* Content */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}>
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(245, 158, 11, 0.05)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <FiShield style={{
              fontSize: '4rem',
              color: '#F59E0B',
              marginBottom: '1rem',
            }} />
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '1rem',
              background: 'linear-gradient(45deg, #F59E0B, #EAB308)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Termos de Uso e Política de Privacidade
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '2rem',
            }}>
              CoinbitClub MarketBot - Versão atualizada Julho/2025
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              color: '#22C55E',
              fontSize: '0.9rem',
              fontWeight: '600',
            }}>
              <FiCheck />
              Documento Oficial e Atualizado
            </div>
          </div>

          {/* Terms Content */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '3rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            
            {/* Section 1 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiShield />
                1. Definições
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#F59E0B' }}>CoinbitClub MarketBot:</strong> plataforma de automação de operações em criptoativos com uso de inteligência artificial e integração via API com exchanges.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#F59E0B' }}>Usuário:</strong> pessoa física ou jurídica que utiliza os serviços da plataforma, diretamente ou via indicação.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#F59E0B' }}>Afiliado:</strong> parceiro autorizado a indicar novos usuários, com direito a comissionamento sobre operações lucrativas.
                </p>
                <p>
                  <strong style={{ color: '#F59E0B' }}>Administrador:</strong> responsável pela gestão e manutenção do sistema.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiUser />
                2. Cadastro e Acesso
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  O usuário deve fornecer dados verdadeiros, incluindo nome completo, WhatsApp (com validação via código), país e e-mail.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Para habilitar saques, são obrigatórios: CPF, banco, agência, conta, tipo de conta e chave PIX.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  É obrigatório validar o WhatsApp no cadastro para segurança e recuperação de conta.
                </p>
                <p>
                  A autenticação é feita via e-mail e senha (com token JWT). É possível resetar senha via validação de WhatsApp ou por administrador.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiDollarSign />
                3. Planos e Comissionamento
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#22C55E', fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Brasil:</h3>
                  <p style={{ marginBottom: '0.5rem' }}>• Plano PRO: R$200/mês + 10% comissão sobre lucro.</p>
                  <p style={{ marginBottom: '1rem' }}>• Plano FLEX: 20% comissão sobre lucro.</p>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#3B82F6', fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Exterior:</h3>
                  <p style={{ marginBottom: '0.5rem' }}>• Plano PRO: USD 50/mês + 10% comissão.</p>
                  <p style={{ marginBottom: '1rem' }}>• Plano FLEX: 20% comissão.</p>
                </div>
                <p style={{ marginBottom: '1rem' }}>
                  Comissão só é cobrada se houver lucro e é descontada do saldo pré-pago após o fechamento da operação.
                </p>
                <p>
                  Conversão BRL/USD com câmbio do dia, visível ao usuário.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiUsers />
                4. Afiliados
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#22C55E' }}>Afiliado Normal:</strong> 1,5% sobre lucro dos indicados.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#EC4899' }}>Afiliado VIP:</strong> 5% sobre lucro (designado por administrador).
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Comissões viram crédito pré-pago após 90 dias. Se não usadas e com inatividade por mais 90 dias, retornam ao sistema.
                </p>
                <p>
                  Pode solicitar vinculação de novo indicado em até 48h após o cadastro.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiLock />
                5. Segurança e Privacidade
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  Dados pessoais são armazenados com criptografia.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Chaves API (Binance e Bybit, produção e testnet) devem ser fornecidas pelo usuário e são protegidas no sistema.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Sistema não acessa fundos diretamente, apenas emite ordens via API.
                </p>
                <p>
                  Dados de operações, planos e transações são armazenados por tempo indeterminado para fins regulatórios e de auditoria.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiZap />
                6. Operacional e Robô
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  A IA toma decisões com base em padrões técnicos, análise de sentimento, eventos globais e comportamento de baleias.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  As operações respeitam configurações como alavancagem máxima, número de operações simultâneas, e uso de saldo.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Podem ocorrer dias sem operações (estratégia de proteção).
                </p>
                <p>
                  Relatórios da IA (Radar da Águia) estão disponíveis para usuário, afiliado e admin.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiCreditCard />
                7. Pagamentos e Stripe
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  Stripe é a plataforma oficial de pagamentos.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Suporta cobrança de planos, recarga de saldo e pagamentos automáticos de comissões.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Reembolsos são processados conforme regras da Stripe e aprovação administrativa.
                </p>
                <p>
                  Datas-padrão para acertos: dias 5 e 20 de cada mês.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiLogOut />
                8. Saques
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  São permitidos saques de saldo pré-pago e comissões, mediante validação de dados.
                </p>
                <p>
                  Solicitações fora das datas automáticas devem ser avaliadas manualmente.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiShield />
                9. Obrigações e Isenções
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  O usuário declara estar ciente dos riscos do mercado cripto.
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  A CoinbitClub não garante lucro e não se responsabiliza por perdas.
                </p>
                <p>
                  O sistema atua com base em algoritmos e análise automatizada, podendo falhar frente a eventos imprevistos.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiUser />
                10. Encerramento de Conta
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  O usuário pode solicitar exclusão da conta, condicionado à liquidação de operações e saldos pendentes.
                </p>
                <p>
                  A plataforma pode suspender contas por uso indevido, fraude, inatividade prolongada ou determinação legal.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiRefreshCw />
                11. Atualizações
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  Estes termos podem ser atualizados a qualquer momento.
                </p>
                <p>
                  O usuário será notificado em caso de mudanças relevantes.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <FiMessageSquare />
                12. Contato e Suporte
              </h2>
              <div style={{ paddingLeft: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                  Suporte via WhatsApp ou canal oficial informado no painel do usuário.
                </p>
                <p>
                  Denúncias, problemas ou sugestões podem ser enviados pela central de atendimento.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              borderTop: '1px solid rgba(245, 158, 11, 0.3)',
              marginTop: '2rem',
            }}>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#F59E0B',
                marginBottom: '0.5rem',
              }}>
                Versão atualizada conforme Especificação Consolidada - Julho/2025
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
              }}>
                Documento oficial da plataforma CoinbitClub MarketBot
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '3rem',
            flexWrap: 'wrap',
          }}>
            <Link href="/auth/login" style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: '2px solid #3B82F6',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <FiUser />
              Fazer Login
            </Link>
            <Link href="/auth/register" style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: '2px solid #F59E0B',
              background: 'linear-gradient(135deg, #F59E0B, #EAB308)',
              color: '#000',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <FiCheck />
              Aceitar e Cadastrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
