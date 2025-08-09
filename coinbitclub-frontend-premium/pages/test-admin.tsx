import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const TestAdminLogin: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testLogin = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@coinbitclub.com',
          password: 'admin123'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Login successful! Redirecting...');
        
        // Salvar no localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirecionar para dashboard
        setTimeout(() => {
          router.push('/admin/dashboard-premium-fixed');
        }, 1000);
      } else {
        setMessage('❌ Login failed: ' + result.message);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testDashboard = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage('❌ No token found. Please login first.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/dashboard-premium', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Dashboard API working! Data received.');
        console.log('Dashboard data:', result);
      } else {
        setMessage('❌ Dashboard API failed: ' + result.message);
      }
    } catch (error) {
      setMessage('❌ Dashboard Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMessage('🗑️ Storage cleared');
  };

  return (
    <>
      <Head>
        <title>Test Admin Login - CoinBitClub</title>
        <meta name="description" content="Test page for admin login" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">
            🧪 Test Admin Functions
          </h1>
          
          <div className="space-y-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Testing Login...' : '🔐 Test Admin Login'}
            </button>

            <button
              onClick={testDashboard}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Testing Dashboard...' : '📊 Test Dashboard API'}
            </button>

            <button
              onClick={clearStorage}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              🗑️ Clear Storage
            </button>

            <button
              onClick={() => router.push('/admin/dashboard-premium-fixed')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              🚀 Go to Dashboard
            </button>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-900 text-green-300' : 
              message.includes('❌') ? 'bg-red-900 text-red-300' : 
              'bg-gray-700 text-gray-300'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-400">
            <p><strong>Test Credentials:</strong></p>
            <p>Email: admin@coinbitclub.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestAdminLogin;
