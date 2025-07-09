import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function callOpenAI(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // ou gpt-4
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 650
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('Erro ao consultar OpenAI:', err.message, prompt);
    throw err;
  }
}
