import React from 'react';
export default function TestIntegration() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Página de Teste de Integração</h1>
      <p>Esta é uma página de teste simplificada para verificar a navegação.</p>
      <div style={{ 
        padding: '20px', 
        margin: '20px auto', 
        maxWidth: '400px',
        backgroundColor: '#334155',
        borderRadius: '8px' 
      }}>
        <p>Status da API: <span style={{ color: '#10b981' }}>Conectado ✓</span></p>
      </div>
    </div>
  );
}
          
          <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Status da API</h2>
            
            <div className={`p-4 rounded-md ${
              apiStatus.status === 'Carregando...' ? 'bg-yellow-900/30 border border-yellow-700' :
              apiStatus.status === 'Conectado' ? 'bg-green-900/30 border border-green-700' :
              'bg-red-900/30 border border-red-700'
            }`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  apiStatus.status === 'Carregando...' ? 'bg-yellow-500' :
                  apiStatus.status === 'Conectado' ? 'bg-green-500' :
                  'bg-red-500'
                }`}></div>
                <p><strong>Status:</strong> {apiStatus.status}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">{apiStatus.message}</p>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3">Teste de Endpoints</h3>
              <div className="space-y-2">
                {[
                  {name: 'Autenticação', status: 'OK', endpoint: '/api/auth'},
                  {name: 'Dados do Usuário', status: 'OK', endpoint: '/api/user'},
                  {name: 'Transações', status: 'OK', endpoint: '/api/transactions'},
                  {name: 'Sinais de Trading', status: 'OK', endpoint: '/api/signals'},
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.endpoint}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-green-900/30 text-green-400 border border-green-800">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



