import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AdminAffiliates from './AdminAffiliates';
import UserDashboard from './UserDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/affiliates" element={<AdminAffiliates />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
