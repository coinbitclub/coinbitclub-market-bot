import React from 'react';

export default function AdminDashboard() {
  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Dashboard Operacional</h1>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        <Card title="Operações em andamento" value="6" />
        <Card title="Operações fechadas hoje" value="18" />
        <Card title="Assertividade do dia" value="83%" />
        <Card title="Assertividade histórica" value="78%" />
        <Card title="Usuários ativos" value="317" />
        <Card title="Assinaturas vigentes" value="164" />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className='p-4 bg-[#101323] rounded-lg shadow'>
      <p className='text-sm'>{title}</p>
      <p className='text-2xl font-semibold mt-2'>{value}</p>
    </div>
  );
}
