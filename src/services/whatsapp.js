import axios from 'axios';

const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE || '3E0819291FB89055AED996E82C2DBF10';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || '2ECE7BD31B3B8E299FC68D6C';

export async function sendWhatsApp(numero, mensagem) {
  if (!numero) throw new Error('Número de WhatsApp não informado.');

  // Garante formato internacional (sem + ou espaços)
  const fone = numero.replace(/\D/g, '');

  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-messages`;

  const body = {
    phone: fone,
    message: mensagem,
  };

  const { data } = await axios.post(url, body);
  return data;
}
