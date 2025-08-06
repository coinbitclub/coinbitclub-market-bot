import React from 'react';
import { NextPage } from 'next';

const NotFound: NextPage = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Página não encontrada</p>
        <a href="/" className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400">
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
