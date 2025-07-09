export async function callOpenAI(prompt) {
  console.log('[🧪 MOCK OPENAI]', prompt.slice(0, 80) + '...');
  return JSON.stringify({
    decisao: "OPERAR",
    justificativa: "Mocked response: tudo validado.",
    sizing: "5%",
    tp: "3%",
    sl: "-1.8%",
    modo: "testnet"
  });
}
