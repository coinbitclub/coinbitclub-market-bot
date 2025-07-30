# CONFIGURAÇÃO TWILIO PARA RAILWAY
# Copie e cole essas variáveis no Railway Console → Environment Variables

# === CONFIGURAÇÕES TWILIO ===
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567

# === CONFIGURAÇÕES DO BANCO ===
DATABASE_URL=postgresql://user:password@host:port/database
RAILWAY_DATABASE_URL=postgresql://user:password@host:port/database

# === OUTRAS CONFIGURAÇÕES ===
NEXTAUTH_SECRET=seu-secret-aqui
NEXTAUTH_URL=https://seu-dominio.railway.app

# === INSTRUÇÕES ===
# 1. Acesse https://console.twilio.com/
# 2. Crie uma conta (trial ou paga)
# 3. No Console Dashboard, encontre:
#    - Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#    - Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 4. Compre um número de telefone no Twilio Console
# 5. Configure essas variáveis no Railway:
#    - Vá para o projeto no Railway
#    - Clique em "Variables"
#    - Adicione cada variável acima
# 6. Faça o deploy da aplicação

# ATENÇÃO: Nunca commite essas credenciais no código!
# Essas variáveis devem ser configuradas APENAS no Railway Console.
