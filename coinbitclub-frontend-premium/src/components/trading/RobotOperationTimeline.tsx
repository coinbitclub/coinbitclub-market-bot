import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiPlay, 
  FiEye, 
  FiSquare, 
  FiDollarSign,
  FiPercent,
  FiZap
} from 'react-icons/fi';

interface OperationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed' | 'success' | 'error';
  color: string;
  glowColor: string;
  duration?: number;
}

interface RobotOperationTimelineProps {
  isActive?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
  compact?: boolean;
}

// Gerar dados realistas aleatórios
const generateRealisticData = () => {
  const cryptos = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'MATIC', 'DOT', 'LINK'];
  const directions = ['LONG', 'SHORT'];
  const profits = [8.45, 12.30, 15.45, 9.87, 18.22, 6.75, 11.56, 14.89, 7.23, 16.44];
  
  const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const profit = profits[Math.floor(Math.random() * profits.length)];
  const entryPrice = (Math.random() * 50000 + 20000).toFixed(2);
  const exitPrice = direction === 'LONG' 
    ? (parseFloat(entryPrice) * (1 + profit/100)).toFixed(2)
    : (parseFloat(entryPrice) * (1 - profit/100)).toFixed(2);
  
  return { crypto, direction, profit, entryPrice, exitPrice };
};

const OPERATION_STEPS: OperationStep[] = [
  {
    id: 'market-reading',
    title: 'LEITURA DE MERCADO',
    description: 'Analisando RSI: 28 (Oversold) | MACD: Bullish Cross | Volume: +45%',
    icon: FiActivity,
    status: 'pending',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    duration: 3000
  },
  {
    id: 'signal-generation',
    title: 'SINAL DE COMPRA/VENDA',
    description: 'Sinal LONG detectado! Comprar BTC/USDT com alta probabilidade',
    icon: FiZap,
    status: 'pending',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    duration: 2000
  },
  {
    id: 'position-opening',
    title: 'ABERTURA DE POSIÇÃO',
    description: 'Ordem executada: Compra BTC $42,350.00 | Stop: $40,500.00',
    icon: FiPlay,
    status: 'pending',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    duration: 1500
  },
  {
    id: 'real-time-monitoring',
    title: 'MONITORAMENTO EM TEMPO REAL',
    description: 'Preço atual: $48,892.50 | P&L: +$6,542.50 | ROI: +15.45%',
    icon: FiEye,
    status: 'pending',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    duration: 8000
  },
  {
    id: 'position-closing',
    title: 'FECHAMENTO DE POSIÇÃO',
    description: 'Take Profit atingido! Vendendo BTC $48,892.50',
    icon: FiSquare,
    status: 'pending',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    duration: 1500
  },
  {
    id: 'result-calculation',
    title: 'RESULTADO (Lucro/Prejuízo)',
    description: '✅ LUCRO: +15.45% | Valor: +$6,542.50 | Tempo: 3h 25min',
    icon: FiDollarSign,
    status: 'pending',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    duration: 2000
  },
  {
    id: 'commission-generation',
    title: 'COMISSIONAMENTO GERADO',
    description: '💰 Comissão (1.5%): $98.14 creditada na sua conta',
    icon: FiPercent,
    status: 'pending',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    duration: 2000
  }
];

export const RobotOperationTimeline: React.FC<RobotOperationTimelineProps> = ({
  isActive = true,
  speed = 'normal',
  compact = false
}) => {
  const [steps, setSteps] = useState<OperationStep[]>(OPERATION_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const speedMultiplier = {
    slow: 1.5,
    normal: 1,
    fast: 0.5
  }[speed];

  // Função para resetar e iniciar novo ciclo
  const startNewCycle = () => {
    // Gerar novos dados realistas para o próximo ciclo
    const data = generateRealisticData();
    
    const updatedSteps = OPERATION_STEPS.map((step, index) => {
      let newDescription = step.description;
      
      switch(step.id) {
        case 'market-reading':
          const rsi = Math.floor(Math.random() * 40) + 20; // 20-60
          const volume = Math.floor(Math.random() * 60) + 20; // 20-80%
          newDescription = `Analisando RSI: ${rsi} (${rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral'}) | MACD: ${data.direction === 'LONG' ? 'Bullish' : 'Bearish'} Cross | Volume: +${volume}%`;
          break;
        case 'signal-generation':
          newDescription = `Sinal ${data.direction} detectado! ${data.direction === 'LONG' ? 'Comprar' : 'Vender'} ${data.crypto}/USDT com alta probabilidade`;
          break;
        case 'position-opening':
          newDescription = `Ordem executada: ${data.direction === 'LONG' ? 'Compra' : 'Venda'} ${data.crypto} $${data.entryPrice} | Stop: $${(parseFloat(data.entryPrice) * 0.95).toFixed(2)}`;
          break;
        case 'real-time-monitoring':
          newDescription = `Preço atual: $${data.exitPrice} | P&L: +$${(parseFloat(data.exitPrice) - parseFloat(data.entryPrice)).toFixed(2)} | ROI: +${data.profit}%`;
          break;
        case 'position-closing':
          newDescription = `Take Profit atingido! ${data.direction === 'LONG' ? 'Vendendo' : 'Comprando'} ${data.crypto} $${data.exitPrice}`;
          break;
        case 'result-calculation':
          const profitValue = (parseFloat(data.exitPrice) - parseFloat(data.entryPrice)).toFixed(2);
          const timeInPosition = Math.floor(Math.random() * 8) + 1; // 1-8 horas
          const minutes = Math.floor(Math.random() * 60);
          newDescription = `✅ LUCRO: +${data.profit}% | Valor: +$${profitValue} | Tempo: ${timeInPosition}h ${minutes}min`;
          break;
        case 'commission-generation':
          const commission = (parseFloat(data.exitPrice) - parseFloat(data.entryPrice)) * 0.015;
          newDescription = `💰 Comissão (1.5%): $${commission.toFixed(2)} creditada na sua conta`;
          break;
      }
      
      return {
        ...step,
        description: newDescription,
        status: index === 0 ? 'active' : 'pending'
      };
    });
    
    setSteps(updatedSteps);
    setCurrentStepIndex(0);
    setIsRunning(true);
  };

  // Função para avançar para próximo step
  const advanceToNextStep = () => {
    setCurrentStepIndex(prev => {
      const nextIndex = prev + 1;
      
      if (nextIndex >= steps.length) {
        // Ciclo completo - agendar novo ciclo
        setIsRunning(false);
        setTimeout(() => {
          setCycleCount(count => count + 1);
          startNewCycle();
        }, 3000 * speedMultiplier);
        return prev;
      }
      
      // Atualizar status dos steps
      setSteps(prevSteps => prevSteps.map((step, index) => {
        if (index < nextIndex) {
          return { ...step, status: 'completed' };
        } else if (index === nextIndex) {
          return { ...step, status: 'active' };
        }
        return { ...step, status: 'pending' };
      }));
      
      return nextIndex;
    });
  };

  // Efeito para controlar o progresso automático
  useEffect(() => {
    if (!isActive || !isRunning || currentStepIndex < 0) return;
    
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;
    
    const timeout = setTimeout(() => {
      // Marcar step atual como completo e avançar
      setSteps(prev => prev.map((step, index) => 
        index === currentStepIndex 
          ? { ...step, status: Math.random() > 0.2 ? 'success' : 'completed' }
          : step
      ));
      
      setTimeout(advanceToNextStep, 500);
    }, (currentStep.duration || 2000) * speedMultiplier);
    
    return () => clearTimeout(timeout);
  }, [currentStepIndex, isRunning, isActive, speedMultiplier]);

  // Iniciar automaticamente quando ativo
  useEffect(() => {
    if (isActive && !isRunning) {
      const timeout = setTimeout(() => {
        startNewCycle();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isActive, isRunning]);

  const getStepIcon = (step: OperationStep, index: number) => {
    const IconComponent = step.icon;
    const isActive = index === currentStepIndex;
    const isCompleted = step.status === 'completed' || step.status === 'success';
    
    return (
      <motion.div
        className="relative flex items-center justify-center w-12 h-12 rounded-full border-2"
        style={{
          borderColor: isActive || isCompleted ? step.color : '#374151',
          backgroundColor: isActive || isCompleted ? `${step.color}20` : 'transparent'
        }}
        animate={{
          boxShadow: isActive 
            ? `0 0 20px ${step.glowColor}, 0 0 40px ${step.glowColor}` 
            : 'none',
          scale: isActive ? 1.1 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{
            rotate: isActive ? 360 : 0,
            color: isActive || isCompleted ? step.color : '#9CA3AF'
          }}
          transition={{
            rotate: { duration: 2, repeat: isActive ? Infinity : 0, ease: "linear" },
            color: { duration: 0.3 }
          }}
        >
          <IconComponent size={24} />
        </motion.div>
        
        {/* Pulse animation para step ativo */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: step.color }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    );
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">🤖 Robô Operando</h3>
          <div className="text-xs text-gray-400">Ciclo #{cycleCount + 1}</div>
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="flex flex-col items-center min-w-0"
              animate={{
                opacity: index <= currentStepIndex ? 1 : 0.5
              }}
            >
              {getStepIcon(step, index)}
              {index < steps.length - 1 && (
                <motion.div
                  className="w-8 h-0.5 bg-gray-600 mt-2"
                  animate={{
                    backgroundColor: index < currentStepIndex ? step.color : '#374151'
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            🤖 Operação do Robô em Tempo Real
          </h2>
          <p className="text-gray-400 text-sm">
            Acompanhe cada etapa do processo automatizado
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Ciclo Atual</div>
          <div className="text-2xl font-bold text-yellow-400">#{cycleCount + 1}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex items-start space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {getStepIcon(step, index)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.div
                className="flex items-center space-x-3 mb-1"
                animate={{
                  opacity: index <= currentStepIndex ? 1 : 0.6
                }}
              >
                <h3 
                  className="font-bold text-sm"
                  style={{
                    color: index <= currentStepIndex ? step.color : '#9CA3AF'
                  }}
                >
                  {step.title}
                </h3>
                
                {index === currentStepIndex && (
                  <motion.div
                    className="px-2 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${step.color}20`,
                      color: step.color,
                      border: `1px solid ${step.color}`
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity
                    }}
                  >
                    EM EXECUÇÃO
                  </motion.div>
                )}
                
                {step.status === 'success' && (
                  <motion.div
                    className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ✓ CONCLUÍDO
                  </motion.div>
                )}
              </motion.div>
              
              <p 
                className="text-sm"
                style={{
                  color: index <= currentStepIndex ? '#E5E7EB' : '#6B7280'
                }}
              >
                {step.description}
              </p>

              {/* Progress bar para step ativo */}
              {index === currentStepIndex && (
                <motion.div
                  className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: step.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: (step.duration || 2000) * speedMultiplier / 1000,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* Connection line */}
            {index < steps.length - 1 && (
              <motion.div
                className="absolute left-6 mt-12 w-0.5 h-8 bg-gray-600"
                style={{ marginLeft: '1.5rem' }}
                animate={{
                  backgroundColor: index < currentStepIndex ? step.color : '#374151'
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Status Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Sistema Ativo</span>
            </div>
            <div className="text-gray-400">
              Velocidade: {speed.toUpperCase()}
            </div>
          </div>
          
          <div className="text-gray-400">
            Próximo ciclo inicia automaticamente
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobotOperationTimeline;
