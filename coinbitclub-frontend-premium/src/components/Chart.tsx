import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// NO MORE MOCK DATA - Real data required from backend
const chartData = []; // Empty array - backend integration required

export default function Chart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e40af33" />
          <XAxis 
            dataKey="time" 
            stroke="#60a5fa"
            fontSize={12}
          />
          <YAxis 
            stroke="#60a5fa"
            fontSize={12}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              color: '#60a5fa',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
            }}
            formatter={(value: any, name: string) => [
              `${value.toFixed(2)}%`,
              name === 'pnl' ? 'P&L' : 'Performance'
            ]}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ fill: '#f9a8d4', strokeWidth: 2, r: 4, stroke: '#ec4899' }}
            activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 2, fill: '#f9a8d4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


