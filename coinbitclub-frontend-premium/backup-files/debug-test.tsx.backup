import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function DebugTest() {
  return (
    <div style={{ backgroundColor: '#0B0F1E', color: '#F9FAFB', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#00FFD1' }}>
          Debug Test - Direct Styles
        </h1>
        
        <div style={{ backgroundColor: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #4B5563' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Card with Direct Styles</h2>
          <p style={{ color: '#9CA3AF' }}>This text should be gray and card should have dark background</p>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Icon Size Test</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <ChartBarIcon style={{ width: '24px', height: '24px', color: '#00FFD1' }} />
            <span>Icon 24px</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ChartBarIcon style={{ width: '32px', height: '32px', color: '#FFC300' }} />
            <span>Icon 32px</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Tailwind Test</h3>
          <div className="mb-4 rounded-md bg-primary p-4 text-primary-foreground">
            <p>This should have primary background color</p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-muted-foreground">This should have card background and muted text</p>
          </div>
        </div>
        
        <div>
          <h3 style={{ marginBottom: '1rem' }}>CSS Variables Check</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            <div>Primary should be: hsl(172 100% 50%) = #00FFD1</div>
            <div>Background should be: hsl(210 25% 8%) = #0B0F1E</div>
            <div>Card should be: hsl(210 25% 12%) = #1F2937</div>
          </div>
        </div>
      </div>
    </div>
  );
}
