import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const CadastroRedirect: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a nova página de registro com SMS
    router.replace('/auth/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p>Redirecionando para a nova página de cadastro...</p>
      </div>
    </div>
  );
};

export default CadastroRedirect;
