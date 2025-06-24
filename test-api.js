import axios from 'axios';

(async () => {
  try {
    const API_KEY = process.env.COINSTATS_API_KEY || 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=';
    const url = 'https://openapiv1.coinstats.app/insights/fear-and-greed';

    const response = await axios.get(url, {
      headers: { 'X-API-KEY': API_KEY }
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Body:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Erro na requisição:', error.response?.data || error.message);
  }
})();
