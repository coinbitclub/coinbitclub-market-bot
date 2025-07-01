import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AdminAffiliates from './pages/AdminAffiliates';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/affiliates" element={<AdminAffiliates />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        {/* Outras rotas que quiser adicionar */}
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
