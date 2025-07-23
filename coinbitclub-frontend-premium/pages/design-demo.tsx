import React from 'react';
import Button from '../src/components/Button';
import Card from '../src/components/Card';

const DesignSystemDemo = () => {
  return (
    <div className="min-h-screen space-y-8 bg-background p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-gradient-brand mb-4 text-4xl font-bold">
            CoinBit Club Design System
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistema de design completo com paleta de cores personalizada
          </p>
        </div>

        {/* Color Palette */}
        <Card className="mb-8 p-6">
          <h2 className="mb-6 text-2xl font-bold">Paleta de Cores</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="glow-primary h-16 w-full rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">Primary (#00FFD1)</p>
            </div>
            <div className="space-y-2">
              <div className="glow-accent h-16 w-full rounded-lg bg-accent"></div>
              <p className="text-sm font-medium">Accent (#FFC300)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full rounded-lg bg-success"></div>
              <p className="text-sm font-medium">Success (#22C55E)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full rounded-lg bg-destructive"></div>
              <p className="text-sm font-medium">Destructive (#EF4444)</p>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <Card className="mb-8 p-6">
          <h2 className="mb-6 text-2xl font-bold">Componentes de Botão</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default" className="glow-primary">
              Primary Button
            </Button>
            <Button variant="secondary">
              Secondary Button
            </Button>
            <Button variant="outline">
              Outline Button
            </Button>
            <Button variant="ghost">
              Ghost Button
            </Button>
            <Button variant="destructive">
              Destructive Button
            </Button>
            <Button variant="default" size="sm">
              Small Button
            </Button>
            <Button variant="default" size="lg" className="glow-accent">
              Large Button
            </Button>
          </div>
        </Card>

        {/* Cards & Effects */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-lift p-6">
            <h3 className="mb-4 text-xl font-bold">Card com Hover Effect</h3>
            <p className="mb-4 text-muted-foreground">
              Este card possui efeito de elevação ao passar o mouse.
            </p>
            <div className="space-y-2">
              <div className="bg-gradient-brand h-3 w-full rounded-full"></div>
              <div className="bg-gradient-dark h-3 w-3/4 rounded-full"></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-xl font-bold">Status Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="status-active">Ativo</span>
                <span className="status-inactive">Inativo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="status-error">Erro</span>
                <span className="status-pending">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="pnl-positive">+15.7%</span>
                <span className="pnl-negative">-3.2%</span>
                <span className="pnl-neutral">0.0%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Form Elements */}
        <Card className="mb-8 p-6">
          <h2 className="mb-6 text-2xl font-bold">Elementos de Formulário</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="form-field">
              <label className="form-label">Input com Focus Ring</label>
              <input
                type="text"
                placeholder="Digite algo aqui..."
                className="form-control focus-ring"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Select com Estilo</label>
              <select className="form-control">
                <option>Opção 1</option>
                <option>Opção 2</option>
                <option>Opção 3</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Loading States */}
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-bold">Estados de Loading</h2>
          <div className="space-y-4">
            <div className="skeleton h-4 w-3/4 rounded"></div>
            <div className="skeleton h-4 w-1/2 rounded"></div>
            <div className="skeleton h-4 w-2/3 rounded"></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
