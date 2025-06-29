import { Configuration, OpenAIApi } from "openai";
import { pool } from "../database.js";
// import { sendWhatsAppMessage } from "./zapiService.js"; // Ative se quiser alertas via WhatsApp

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function buildPrompt(lang = "pt") {
  // Exemplo: Busque os dados mais relevantes e atuais do sistema!
  const { rows: [market] } = await pool.query(
    "SELECT * FROM market ORDER BY captured_at DESC LIMIT 1"
  );
  const { rows: [signal] } = await pool.query(
    "SELECT * FROM signals ORDER BY created_at DESC LIMIT 1"
  );
  // Adicione outros dados conforme necessidade!

  // Prompt padrão (segue o modelo do projeto)
  return `
Gere um boletim diário do mercado cripto no seguinte formato:
• Contexto macroeconômico global (máx 3 tópicos)
• Contexto do mercado cripto (máx 4 tópicos)
• Tendência predominante
• Robô ideal para o dia
• Recomendações práticas
• Interpretação estratégica resumida (sentimento, risco, oportunidades)
• Ações recomendadas para hoje (bullet points)
Use dados atuais ou simule o contexto caso não tenha acesso em tempo real.
Linguagem objetiva, profissional, sem rodeios.
${lang === "en" ? "Traduza o relatório para inglês." : ""}
Dados atuais:
${JSON.stringify({ market, signal })}
`;
}

export async function generateAndSaveAiReport(lang = "pt") {
  const prompt = await buildPrompt(lang);

  try {
    const aiRes = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 800,
      temperature: 0.6,
    });
    const report = aiRes.data.choices[0].message.content;

    // Loga prompt/resposta (pode ser limpo depois)
    await pool.query(
      `INSERT INTO ai_logs (prompt, response, status) VALUES ($1, $2, 'ok')`,
      [prompt, report]
    );

    // Salva/atualiza o último relatório (1 linha sempre)
    await pool.query(
      `DELETE FROM ai_market_report; INSERT INTO ai_market_report (report, language) VALUES ($1, $2);`,
      [report, lang]
    );

    return report;
  } catch (error) {
    await pool.query(
      `INSERT INTO ai_logs (prompt, response, status) VALUES ($1, $2, 'error')`,
      [prompt, error.message]
    );
    // // Alerta via WhatsApp se desejar:
    // await sendWhatsAppMessage(process.env.ADMIN_PHONE, `[ERRO IA]: ${error.message}`);
    throw error;
  }
}
