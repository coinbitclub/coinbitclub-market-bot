import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiActivity, 
  FiTrendingUp, 
  FiPlay, 
  FiEye, 
  FiSquare, 
  FiDollarSign,
  FiPercent,
  FiZap
} from 'react-icons/fi';

interface CompactRobotStatusProps {
  isActive?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const STEPS = [
  { icon: FiActivity, label: 'Leitura', color: '#3B82F6' },
  { icon: FiZap, label: 'Sinal', color: '#F59E0B' },
  { icon: FiPlay, label: 'Abertura', color: '#10B981' },
  { icon: FiEye, label: 'Monitor', color: '#8B5CF6' },
  { icon: FiSquare, label: 'Fechamento', color: '#EF4444' },
  { icon: FiDollarSign, label: 'Resultado', color: '#06B6D4' },
  { icon: FiPercent, label: 'Comissão', color: '#FFD700' }
];

export const CompactRobotStatus: React.FC<CompactRobotStatusProps> = ({
  isActive = true,
  showDetails = false,
  size = 'medium'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(isActive);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % STEPS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8', 
    large: 'w-10 h-10'
  };

  const currentStepData = STEPS[currentStep];

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2">
        <motion.div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2`}
          style={{
            borderColor: isRunning ? currentStepData.color : '#374151',
            backgroundColor: isRunning ? `${currentStepData.color}20` : 'transparent'
          }}
          animate={{
            boxShadow: isRunning 
              ? `0 0 15px ${currentStepData.color}40` 
              : 'none',
            scale: isRunning ? [1, 1.1, 1] : 1
          }}
          transition={{
            scale: { duration: 1, repeat: Infinity },
            boxShadow: { duration: 0.3 }
          }}
        >
          <motion.div
            animate={{
              rotate: isRunning ? 360 : 0,
              color: isRunning ? currentStepData.color : '#9CA3AF'
            }}
            transition={{
              rotate: { duration: 2, repeat: isRunning ? Infinity : 0, ease: "linear" },
              color: { duration: 0.3 }
            }}
          >
            <currentStepData.icon size={size === 'small' ? 14 : size === 'medium' ? 18 : 22} />
          </motion.div>
        </motion.div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Robô</span>
          <span 
            className="text-sm font-medium"
            style={{ color: isRunning ? currentStepData.color : '#9CA3AF' }}
          >
            {isRunning ? currentStepData.label : 'Parado'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">🤖 Status do Robô</h4>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isRunning 
            ? 'bg-green-500/20 text-green-400 border border-green-500' 
            : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          {isRunning ? 'ATIVO' : 'INATIVO'}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep && isRunning;
          const isPassed = index < currentStep && isRunning;
          
          return (
            <motion.div
              key={index}
              className="flex flex-col items-center"
              animate={{
                opacity: isActive || isPassed ? 1 : 0.4
              }}
            >
              <motion.div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center mb-1"
                style={{
                  borderColor: isActive || isPassed ? step.color : '#374151',
                  backgroundColor: isActive ? `${step.color}30` : isPassed ? `${step.color}20` : 'transparent'
                }}
                animate={{
                  scale: isActive ? [1, 1.2, 1] : 1,
                  boxShadow: isActive ? `0 0 10px ${step.color}60` : 'none'
                }}
                transition={{
                  scale: { duration: 1, repeat: isActive ? Infinity : 0 }
                }}
              >
                <Icon 
                  size={12} 
                  color={isActive || isPassed ? step.color : '#6B7280'} 
                />
              </motion.div>
              <span 
                className="text-xs text-center leading-tight"
                style={{ 
                  color: isActive || isPassed ? step.color : '#6B7280',
                  fontSize: '10px'
                }}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {isRunning && (
        <motion.div className="text-center">
          <span 
            className="text-xs font-medium"
            style={{ color: currentStepData.color }}
          >
            {currentStepData.label.toUpperCase()} EM ANDAMENTO
          </span>
          <motion.div
            className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: currentStepData.color }}
              animate={{ width: ['0%', '100%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CompactRobotStatus;


