const useMock = process.env.USE_MOCK_AI === 'true';

export async function callOpenAI(prompt, fallbackKey = 'result') {
  if (useMock) {
    const { callOpenAI: mockCall } = await import('../ia/mocks/mockOpenAI.js');
    const response = await mockCall(prompt);

    return typeof response === 'string'
      ? { [fallbackKey]: response }
      : { [fallbackKey]: { ...response } };
  }

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3
    });

    let content = response?.choices?.[0]?.message?.content?.trim();
    if (!content) return { [fallbackKey]: 'SEM RESPOSTA' };

    content = content.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(content);
      return typeof parsed === 'object' ? parsed : { [fallbackKey]: parsed };
    } catch {
      return { [fallbackKey]: content };
    }
  } catch (err) {
    console.error('[OpenAI Error]', err.message, '\nPrompt:', prompt);
    return { [fallbackKey]: 'ERRO AO CONSULTAR IA' };
  }
}
