export function buildSystemPrompt() {
  return 'You are a trading assistant.';
}

export function buildUserPrompt(context) {
  return JSON.stringify(context);
}
