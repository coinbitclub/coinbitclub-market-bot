import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })
);

export async function callOpenAI(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4o", // Ou "gpt-4" se quiser reduzir custo
      messages: [{ role: "user", content: prompt }],
      max_tokens: 650
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("Erro ao consultar OpenAI:", err.message, prompt);
    throw err;
  }
}
