import { Configuration, OpenAIApi } from 'openai';
import { buildSystemPrompt, buildUserPrompt } from './promptTemplates.js';

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

export async function aiFallback(context) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(context) },
    { role: 'user', content: buildUserPrompt(context) }
  ];
  const { data } = await openai.createChatCompletion({ model: 'gpt-4', messages, temperature: 0.2 });
  return JSON.parse(data.choices[0].message.content);
}
