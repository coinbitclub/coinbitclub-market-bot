# Guia de Deploy Manual para Railway

Este documento fornece instruções passo a passo para fazer deploy do CoinbitClub Market Bot no Railway.

## Pré-requisitos

1. Ter o Railway CLI instalado: `npm install -g @railway/cli`
2. Ter uma conta no Railway
3. Ter acesso ao projeto no Railway

## Preparação

1. Verifique se o Dockerfile está correto
2. Verifique se o arquivo railway.json está configurado corretamente
3. Certifique-se de que o .env.railway contém as variáveis necessárias

## Passos para Deploy

### 1. Login no Railway

```
railway login
```

### 2. Vincular ao projeto existente

```
railway link
```

### 3. Verificar status atual

```
railway status
```

### 4. Fazer upload do código

```
railway up
```

### 5. Verificar logs para problemas

```
railway logs
```

### 6. Configurar variáveis de ambiente (se necessário)

```
railway variables
```

## Solução de Problemas Comuns

### Erro de Conexão com o Banco de Dados

Verifique se a variável `DATABASE_URL` está corretamente configurada no Railway Dashboard.

### Erro de Porta em Uso

A porta padrão no Railway é 3000, mas o código usa 8080. Certifique-se de que o código escuta a porta fornecida pelo ambiente:

```javascript
const port = process.env.PORT || 8080;
```

### Erro de Dependências

Se houver problemas com dependências, tente:

1. Remover o package-lock.json
2. Atualizar o Dockerfile para instalar dependências corretamente
3. Verificar se todas as dependências estão listadas no package.json

## Deploy do Frontend no Vercel

Depois que o backend estiver funcionando no Railway, atualize a URL da API no frontend e faça deploy no Vercel:

1. Certifique-se de que vercel.json está configurado corretamente
2. Use o seguinte comando:

```
cd coinbitclub-frontend-premium
vercel --prod
```

## Verificação Pós-Deploy

1. Teste a API em: `https://[seu-app].railway.app/health`
2. Verifique os logs para erros: `railway logs`
3. Monitore o uso de recursos no Railway Dashboard
