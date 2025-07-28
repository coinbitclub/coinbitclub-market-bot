import React from 'react';
import { ChartBarIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Test CSS Variables */}
      <div className="space-y-8 p-8">
        <h1 className="text-center text-4xl font-bold">CSS Variables Test</h1>
        
        {/* Test Colors */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto size-16 rounded bg-primary"></div>
            <p className="text-sm">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto size-16 rounded bg-accent"></div>
            <p className="text-sm">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto size-16 rounded bg-success"></div>
            <p className="text-sm">Success</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto size-16 rounded border border-border bg-card"></div>
            <p className="text-sm">Card</p>
          </div>
        </div>
        
        {/* Test Icons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Icon Size Test</h2>
          <div className="flex items-center gap-4">
            <ChartBarIcon className="size-6 text-primary" />
            <span>Normal size (w-6 h-6)</span>
          </div>
          <div className="flex items-center gap-4">
            <ShieldCheckIcon className="size-8 text-accent" />
            <span>Medium size (w-8 h-8)</span>
          </div>
          <div className="flex items-center gap-4">
            <ClockIcon className="size-12 text-success" />
            <span>Large size (w-12 h-12)</span>
          </div>
        </div>
        
        {/* Test Typography */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Typography Test</h2>
          <p className="text-base text-foreground">Regular text in foreground color</p>
          <p className="text-base text-muted-foreground">Muted text</p>
          <p className="text-sm text-muted-foreground">Small muted text</p>
        </div>
        
        {/* Test Buttons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Button Test</h2>
          <div className="flex gap-4">
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
              Primary Button
            </button>
            <button className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground">
              Secondary Button
            </button>
            <button className="rounded-md bg-accent px-4 py-2 text-accent-foreground">
              Accent Button
            </button>
          </div>
        </div>
        
        {/* CSS Variable Values Display */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-2xl font-semibold">CSS Variables Values</h2>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            <div>--background: <span className="text-primary">210 25% 8%</span></div>
            <div>--foreground: <span className="text-accent">210 40% 98%</span></div>
            <div>--primary: <span className="text-primary">172 100% 50%</span></div>
            <div>--accent: <span className="text-accent">48 100% 50%</span></div>
            <div>--card: <span className="text-muted-foreground">210 25% 12%</span></div>
            <div>--border: <span className="text-muted-foreground">210 25% 20%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
