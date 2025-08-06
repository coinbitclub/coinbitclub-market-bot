import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

// Prompt base para IA conforme especificado
const AI_PROMPT_BASE = `
Você é uma IA especializada em análise de mercado cripto integrada a dados globais. Sua função é gerar automaticamente o boletim institucional diário chamado RADAR DA ÁGUIA NEWS, com linguagem objetiva e estratégica, voltado para traders e investidores de cripto.

A cada 4 horas (foco em abertura e fechamento das bolsas asiáticas e americanas), você deve buscar, analisar e sintetizar os principais dados e eventos que impactam diretamente o mercado de criptomoedas.

Se houver quebra de recordes, liquidações ou surpresas macroeconômicas, destaque esses fatos com impacto direto no BTC, ETH e stablecoins.
❗ Sempre use linguagem objetiva, estratégica e sem jargões técnicos difíceis, focada em traders que operam com disciplina tática.

A estrutura do boletim deve sempre conter:
________________________________________
RADAR DA ÁGUIA NEWS – [DATA] – [Cenário: Alta / Baixa / Lateralização com Alta Volatilidade]
🔹 Principais Notícias do Período
1.	Destaque global do cripto (alta/queda/recorde/etc)
2.	Eventos regulatórios ou políticos impactantes (EUA, China, Europa)
3.	Indicadores econômicos divulgados (CPI, PPI, FOMC, emprego)
4.	Fluxos institucionais (ETFs, stablecoins, adoção por bancos)
5.	Destaques de altcoins e movimentações de whales
🔹 Feriados & Eventos Econômicos
•	China: [informar feriado ou "sem feriado"]
•	EUA: [informar feriado ou eventos relevantes como CPI, Payroll, FOMC, etc]
🔹 Impacto Potencial
Liste 3 a 5 pontos sobre como os fatores acima influenciam o mercado (liquidez, risco, suporte técnico, etc)
🔹 Tendência
Classifique o momento atual como:
Lateralização com Alta Volatilidade ou Alta com Pullback Técnico ou Baixa com Suporte Forte

🦅 RADAR DA ÁGUIA NEWS – [DATA] – [CENÁRIO]
🔹 Tendência
[Descrição da tendência atual]
________________________________________
🔹 Feriados e Eventos Econômicos
•	China: [status]
•	EUA: [status e eventos]
________________________________________

🔹 Principais Notícias do Dia
[Lista numerada das principais notícias]

Gere um relatório completo seguindo exatamente esta estrutura.
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      await handleGenerateReport(req, res);
    } else if (req.method === 'GET') {
      await handleGetReports(req, res);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de relatórios IA:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGenerateReport(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se é admin (para geração manual) ou chamada automática
  try {
    requireAdmin(req);
  } catch (error) {
    // Se não for admin, verificar se é uma chamada do sistema
    const { systemKey } = req.body;
    if (systemKey !== process.env.SYSTEM_API_KEY) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }
  }

  try {
    // Verificar se já foi gerado um relatório nas últimas 4 horas
    const lastReportResult = await query(`
      SELECT created_at FROM ai_reports 
      WHERE published_at IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    if (lastReportResult.rows.length > 0) {
      const lastReportTime = new Date(lastReportResult.rows[0].created_at);
      if (lastReportTime > fourHoursAgo) {
        return res.status(429).json({ 
          message: 'Relatório já foi gerado nas últimas 4 horas',
          nextAllowedTime: new Date(lastReportTime.getTime() + 4 * 60 * 60 * 1000)
        });
      }
    }

    // Gerar relatório IA
    const report = await generateAIReport();

    // Salvar no banco
    const reportResult = await query(`
      INSERT INTO ai_reports (
        title, content, market_scenario, main_news, 
        holidays, potential_impact, trend, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, created_at
    `, [
      report.title,
      report.content,
      report.marketScenario,
      JSON.stringify(report.mainNews),
      JSON.stringify(report.holidays),
      JSON.stringify(report.potentialImpact),
      report.trend
    ]);

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, 'AI_REPORT_GENERATED', 'ai_reports', $2, $3)`,
      [null, reportResult.rows[0].id, JSON.stringify({ auto_generated: true })]
    );

    res.status(200).json({
      message: 'Relatório IA gerado com sucesso',
      report: {
        id: reportResult.rows[0].id,
        createdAt: reportResult.rows[0].created_at,
        ...report
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório IA:', error);
    res.status(500).json({ 
      message: 'Erro ao gerar relatório IA' 
    });
  }
}

async function handleGetReports(req: NextApiRequest, res: NextApiResponse) {
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const reportsResult = await query(`
    SELECT 
      id, title, content, market_scenario, main_news,
      holidays, potential_impact, trend, published_at, created_at
    FROM ai_reports 
    WHERE published_at IS NOT NULL
    ORDER BY published_at DESC
    LIMIT $1 OFFSET $2
  `, [parseInt(limit as string), offset]);

  const totalResult = await query(`
    SELECT COUNT(*) as total FROM ai_reports WHERE published_at IS NOT NULL
  `);

  const reports = reportsResult.rows.map(report => ({
    id: report.id,
    title: report.title,
    content: report.content,
    marketScenario: report.market_scenario,
    mainNews: report.main_news,
    holidays: report.holidays,
    potentialImpact: report.potential_impact,
    trend: report.trend,
    publishedAt: report.published_at,
    createdAt: report.created_at
  }));

  res.status(200).json({
    reports,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: parseInt(totalResult.rows[0].total),
      totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / parseInt(limit as string))
    }
  });
}

async function generateAIReport(): Promise<{
  title: string;
  content: string;
  marketScenario: string;
  mainNews: string[];
  holidays: { china: string; usa: string };
  potentialImpact: string[];
  trend: string;
}> {
  // Em um ambiente real, aqui seria feita a integração com:
  // 1. APIs de dados de mercado (CoinGecko, CoinMarketCap, etc.)
  // 2. APIs de notícias financeiras (Reuters, Bloomberg, etc.)
  // 3. APIs de indicadores econômicos
  // 4. OpenAI GPT ou outra IA para análise

  // Por enquanto, vamos simular um relatório baseado em dados atuais
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentHour = new Date().getHours();

  // Determinar cenário baseado na hora (simulação)
  let marketScenario = 'lateralizacao_alta_volatilidade';
  if (currentHour >= 6 && currentHour <= 12) {
    marketScenario = 'alta_pullback_tecnico';
  } else if (currentHour >= 18 && currentHour <= 23) {
    marketScenario = 'baixa_suporte_forte';
  }

  // Simular dados de notícias (em produção seria obtido via APIs)
  const mainNews = [
    'Bitcoin mantém consolidação próximo aos $67.000, enquanto Ethereum ganha 1,8% e testa resistência de $3.400',
    'Federal Reserve sinaliza possível corte de juros em setembro, impulsionando apetite por ativos de risco',
    'ETFs de Bitcoin registram entrada líquida de $180 milhões nas últimas 24 horas',
    'China aprova nova regulamentação para exchanges locais, mercado reage positivamente',
    'Whale Alert: Grande movimentação de 5.000 BTC de carteira desconhecida para Binance'
  ];

  const holidays = {
    china: 'sem feriados hoje — liquidez normal nas bolsas asiáticas',
    usa: 'sem feriados — mercado aguarda dados de inflação na próxima semana'
  };

  const potentialImpact = [
    'Liquidez permanece estável com volumes moderados em todas as principais exchanges',
    'Resistência técnica em $68.500 para Bitcoin pode definir próximo movimento',
    'Fluxo institucional positivo através dos ETFs mantém pressão compradora',
    'Correlação com índices tradicionais diminui, indicando descorrelação saudável',
    'Altcoins mostram sinais de recuperação com dominância do Bitcoin estável em 52%'
  ];

  const trend = 'Lateralização com alta volatilidade — faixa estimada entre $65.5k e $68.5k para Bitcoin';

  const title = `RADAR DA ÁGUIA NEWS – ${currentDate} – ${getScenarioText(marketScenario)}`;

  const content = `🦅 RADAR DA ÁGUIA NEWS – ${currentDate} – ${getScenarioText(marketScenario)}

🔹 Tendência
${trend}
________________________________________

🔹 Feriados e Eventos Econômicos
• China: ${holidays.china}
• EUA: ${holidays.usa}
________________________________________

🔹 Principais Notícias do Período
${mainNews.map((news, index) => `${index + 1}. ${news}`).join('\n')}

🔹 Impacto Potencial
${potentialImpact.map(impact => `• ${impact}`).join('\n')}

🔹 Análise Técnica
O mercado mantém padrão de consolidação após recente alta, com suporte sólido na região de $65.500. 
Volumes decrescentes indicam possível movimentação iminente. Indicadores técnicos mostram divergência 
bullish no RSI de 4h, enquanto médias móveis permanecem em configuração de alta.

Resistências: $68.500 | $70.200 | $72.800
Suportes: $65.500 | $63.200 | $61.000

Recomendação: Aguardar rompimento confirmado da resistência ou teste do suporte para posicionamento.
`;

  return {
    title,
    content,
    marketScenario,
    mainNews,
    holidays,
    potentialImpact,
    trend
  };
}

function getScenarioText(scenario: string): string {
  switch (scenario) {
    case 'alta':
      return 'Alta';
    case 'baixa':
      return 'Baixa';
    case 'lateralizacao_alta_volatilidade':
      return 'Lateralização com Alta Volatilidade';
    case 'alta_pullback_tecnico':
      return 'Alta com Pullback Técnico';
    case 'baixa_suporte_forte':
      return 'Baixa com Suporte Forte';
    default:
      return 'Análise de Mercado';
  }
}
