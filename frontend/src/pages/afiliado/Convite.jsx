import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AffiliateConvite() {
  const [link, setLink] = useState('');

  useEffect(() => {
    api.get('/affiliate/invite')
      .then(res => setLink(res.data.link))
      .catch(() => {});
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  if (!link) return <div>Gerando link…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meu Link de Convite</h1>
      <div className="p-6 bg-[#101323] rounded-lg shadow space-y-4">
        <p className="break-all">{link}</p>
        <button
          onClick={copy}
          className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500"
        >
          Copiar para área de transferência
        </button>
      </div>
    </div>
  );
}
