import OpenAI from 'openai';

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIReportData {
  id: string;
  title: string;
  content: string;
  summary: string;
  marketScenario: string;
  mainNews: string[];
  holidays: string[];
  potentialImpact: string;
  trendAnalysis: string;
  createdAt: Date;
  type: 'RADAR_DA_AGUIA' | 'TRADE_ANALYSIS' | 'MARKET_UPDATE';
}

export interface MarketData {
  btcPrice: number;
  ethPrice: number;
  marketCap: number;
  volume24h: number;
  dominance: number;
  fearGreedIndex: number;
  trending: string[];
}

export interface TradeAnalysis {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  entryPoint: number;
  stopLoss: number;
  takeProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class AIService {
  
  // Gerar relatório RADAR DA ÁGUIA NEWS
  async generateRadarDaAguiaReport(marketData: MarketData): Promise<AIReportData> {
    try {
      const prompt = `
        Como analista especialista em criptomoedas, gere um relatório completo no formato RADAR DA ÁGUIA NEWS com as seguintes informações:

        DADOS DE MERCADO:
        - Bitcoin: $${marketData.btcPrice.toLocaleString()}
        - Ethereum: $${marketData.ethPrice.toLocaleString()}
        - Market Cap Total: $${marketData.marketCap.toLocaleString()}
        - Volume 24h: $${marketData.volume24h.toLocaleString()}
        - Dominância BTC: ${marketData.dominance}%
        - Fear & Greed Index: ${marketData.fearGreedIndex}
        - Trending: ${marketData.trending.join(', ')}

        FORMATO OBRIGATÓRIO:
        
        🦅 **RADAR DA ÁGUIA NEWS** 🦅
        📅 ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}

        📊 **CENÁRIO DO MERCADO:**
        [Análise detalhada do cenário atual em 2-3 parágrafos]

        📰 **PRINCIPAIS NOTÍCIAS:**
        • [Notícia 1 com impacto no mercado]
        • [Notícia 2 com impacto no mercado]
        • [Notícia 3 com impacto no mercado]
        • [Notícia 4 com impacto no mercado]

        🏛️ **FERIADOS E EVENTOS:**
        • [Eventos econômicos importantes da semana]
        • [Feriados que podem afetar o volume]
        • [Releases importantes de dados econômicos]

        🎯 **IMPACTO POTENCIAL:**
        [Análise de como os eventos podem influenciar as criptomoedas - 1 parágrafo]

        📈 **ANÁLISE DE TENDÊNCIAS:**
        [Análise técnica e fundamental das principais criptomoedas - 2 parágrafos]

        ⚡ **RESUMO EXECUTIVO:**
        [Resumo em 3-4 linhas das principais oportunidades e riscos]

        Use linguagem profissional mas acessível. Seja específico nas análises e cite números quando relevante.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um analista especialista em criptomoedas com 10+ anos de experiência em mercados financeiros. Sua especialidade é identificar oportunidades e riscos através de análise técnica e fundamental."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0]?.message?.content || '';
      
      // Extrair seções do relatório
      const marketScenario = this.extractSection(content, 'CENÁRIO DO MERCADO');
      const mainNews = this.extractList(content, 'PRINCIPAIS NOTÍCIAS');
      const holidays = this.extractList(content, 'FERIADOS E EVENTOS');
      const potentialImpact = this.extractSection(content, 'IMPACTO POTENCIAL');
      const trendAnalysis = this.extractSection(content, 'ANÁLISE DE TENDÊNCIAS');
      const summary = this.extractSection(content, 'RESUMO EXECUTIVO');

      return {
        id: `radar_${Date.now()}`,
        title: `RADAR DA ÁGUIA NEWS - ${new Date().toLocaleDateString('pt-BR')}`,
        content,
        summary,
        marketScenario,
        mainNews,
        holidays,
        potentialImpact,
        trendAnalysis,
        createdAt: new Date(),
        type: 'RADAR_DA_AGUIA'
      };
    } catch (error) {
      console.error('Erro ao gerar relatório RADAR DA ÁGUIA:', error);
      throw new Error('Erro ao gerar relatório de IA');
    }
  }

  // Analisar operação de trade com IA
  async analyzeTradeResult(
    symbol: string,
    entryPrice: number,
    exitPrice: number,
    result: 'profit' | 'loss',
    marketConditions: string
  ): Promise<string> {
    try {
      const prompt = `
        Como especialista em trading de criptomoedas, analise esta operação e forneça insights:

        DADOS DA OPERAÇÃO:
        - Par: ${symbol}
        - Preço de Entrada: $${entryPrice}
        - Preço de Saída: $${exitPrice}
        - Resultado: ${result === 'profit' ? 'LUCRO' : 'PREJUÍZO'}
        - Variação: ${(((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2)}%
        - Condições do Mercado: ${marketConditions}

        FORNEÇA UMA ANÁLISE DETALHADA EM 3 PARÁGRAFOS:
        1. O que aconteceu na operação e por quê
        2. Análise técnica do movimento do preço
        3. Lições aprendidas e melhorias para próximas operações

        Use linguagem clara e educativa. ${result === 'loss' ? 'Foque em aprendizado e melhorias.' : 'Destaque os fatores de sucesso.'}
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um mentor experiente em trading de criptomoedas, especialista em análise post-trade e educação financeira."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 800
      });

      return completion.choices[0]?.message?.content || 'Análise não disponível';
    } catch (error) {
      console.error('Erro ao analisar trade:', error);
      return 'Erro ao gerar análise da operação';
    }
  }

  // Gerar análise de mercado personalizada
  async generateMarketAnalysis(
    symbols: string[],
    timeframe: '1h' | '4h' | '1d',
    userLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<string> {
    try {
      const prompt = `
        Gere uma análise de mercado personalizada para um trader ${userLevel} sobre os seguintes ativos:
        ${symbols.join(', ')}

        Timeframe: ${timeframe}
        
        ESTRUTURA DA ANÁLISE:
        1. Overview do mercado atual
        2. Análise individual de cada ativo
        3. Oportunidades identificadas
        4. Gestão de risco recomendada
        5. Plano de ação sugerido

        Adapte a linguagem para o nível do usuário:
        - Beginner: Explicações básicas, foco em educação
        - Intermediate: Análise técnica moderada, alguns indicadores
        - Advanced: Análise completa, múltiplos indicadores, correlações

        Seja específico e acionável.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um analista quantitativo especializado em criptomoedas, capaz de adaptar análises para diferentes níveis de experiência."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return completion.choices[0]?.message?.content || 'Análise não disponível';
    } catch (error) {
      console.error('Erro ao gerar análise de mercado:', error);
      return 'Erro ao gerar análise de mercado';
    }
  }

  // Gerar sugestão de trade
  async generateTradeRecommendation(
    symbol: string,
    currentPrice: number,
    marketData: Partial<MarketData>
  ): Promise<TradeAnalysis> {
    try {
      const prompt = `
        Como analista quantitativo, forneça uma recomendação de trade para:
        
        Par: ${symbol}
        Preço Atual: $${currentPrice}
        Market Cap: $${marketData.marketCap?.toLocaleString() || 'N/A'}
        Volume 24h: $${marketData.volume24h?.toLocaleString() || 'N/A'}
        Fear & Greed: ${marketData.fearGreedIndex || 'N/A'}

        RESPONDA NO FORMATO JSON:
        {
          "action": "buy/sell/hold",
          "confidence": 0-100,
          "reasoning": "explicação detalhada da recomendação",
          "entryPoint": preço_de_entrada,
          "stopLoss": preço_stop_loss,
          "takeProfit": preço_take_profit,
          "riskLevel": "low/medium/high"
        }

        Base sua análise em:
        - Condições técnicas atuais
        - Momentum do mercado
        - Gestão de risco apropriada
        - Cenário macro
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um trader quantitativo experiente que sempre prioriza gestão de risco. Forneça respostas apenas em JSON válido."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(response);

      return {
        symbol,
        action: analysis.action || 'hold',
        confidence: analysis.confidence || 50,
        reasoning: analysis.reasoning || 'Análise não disponível',
        entryPoint: analysis.entryPoint || currentPrice,
        stopLoss: analysis.stopLoss || currentPrice * 0.95,
        takeProfit: analysis.takeProfit || currentPrice * 1.05,
        riskLevel: analysis.riskLevel || 'medium'
      };
    } catch (error) {
      console.error('Erro ao gerar recomendação de trade:', error);
      return {
        symbol,
        action: 'hold',
        confidence: 0,
        reasoning: 'Erro ao gerar recomendação',
        entryPoint: currentPrice,
        stopLoss: currentPrice * 0.95,
        takeProfit: currentPrice * 1.05,
        riskLevel: 'high'
      };
    }
  }

  // Funções auxiliares para extrair seções do relatório
  private extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractList(content: string, sectionName: string): string[] {
    const section = this.extractSection(content, sectionName);
    const items = section.split('•').filter(item => item.trim().length > 0);
    return items.map(item => item.trim());
  }

  // Resumir texto longo
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
    try {
      const prompt = `
        Resuma o seguinte texto em no máximo ${maxLength} caracteres, mantendo as informações mais importantes:

        ${text}
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: Math.ceil(maxLength / 3)
      });

      return completion.choices[0]?.message?.content || text.substring(0, maxLength);
    } catch (error) {
      console.error('Erro ao resumir texto:', error);
      return text.substring(0, maxLength);
    }
  }
}

// Instância singleton do serviço
export const aiService = new AIService();

// Função para validar se a API está configurada
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Função para estimar custos de tokens
export function estimateTokenCost(text: string): number {
  // Estimativa aproximada: 1 token ≈ 4 caracteres
  const tokens = Math.ceil(text.length / 4);
  // GPT-4: $0.03 per 1K tokens input, $0.06 per 1K tokens output
  return (tokens / 1000) * 0.045; // Média entre input e output
}
