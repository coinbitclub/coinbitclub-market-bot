import OpenAI from 'openai';
import { buildSystemPrompt, buildUserPrompt } from './promptTemplates.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function aiFallback(context) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(context) },
    { role: 'user', content: buildUserPrompt(context) }
  ];
  
  const response = await openai.chat.completions.create({ 
    model: 'gpt-4', 
    messages, 
    temperature: 0.2 
  });
  
  return JSON.parse(response.choices[0].message.content);
}
