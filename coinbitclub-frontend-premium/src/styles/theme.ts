// Configuração de tema premium para CoinBitClub
export const premiumTheme = {
  colors: {
    // Cores principais
    background: {
      primary: '#000000',
      secondary: '#0a0a0a',
      tertiary: '#1a1a2e',
      surface: '#16213e',
      elevated: '#1e3a2e',
    },
    
    // Cores de texto
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      muted: '#6B7280',
      accent: '#FFD700',
    },
    
    // Cores de ação
    action: {
      primary: '#FFD700', // Dourado principal
      secondary: '#00BFFF', // Azul neon
      accent: '#FF69B4', // Rosa neon
      hover: '#FFA500', // Laranja
    },
    
    // Estados
    status: {
      success: '#4ade80',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Trading
    trading: {
      buy: '#22c55e',
      sell: '#ef4444',
      neutral: '#6b7280',
    },
  },
  
  // Gradientes premium
  gradients: {
    title: 'linear-gradient(90deg, #FF6B35, #F7931E, #FF69B4)',
    button: 'linear-gradient(135deg, #FFD700, #FFA500)',
    card: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    neon: 'linear-gradient(45deg, #00BFFF, #FF69B4)',
    gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a2e 100%)',
  },
  
  // Efeitos visuais
  effects: {
    glow: {
      gold: '0 0 20px rgba(255, 215, 0, 0.4)',
      blue: '0 0 20px rgba(0, 191, 255, 0.4)',
      pink: '0 0 20px rgba(255, 105, 180, 0.4)',
      success: '0 0 20px rgba(74, 222, 128, 0.4)',
      error: '0 0 20px rgba(239, 68, 68, 0.4)',
    },
    shadow: {
      small: '0 2px 8px rgba(0, 0, 0, 0.2)',
      medium: '0 4px 16px rgba(0, 0, 0, 0.3)',
      large: '0 8px 32px rgba(0, 0, 0, 0.4)',
      premium: '0 12px 40px rgba(255, 215, 0, 0.1)',
    },
    blur: {
      glass: 'blur(10px)',
      backdrop: 'blur(20px)',
    },
  },
  
  // Espaçamentos
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },
  
  // Bordas e raios
  border: {
    radius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
    },
  },
  
  // Tipografia
  typography: {
    fonts: {
      primary: "'Inter', sans-serif",
      mono: "'Fira Code', monospace",
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Animações
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Breakpoints responsivos
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    modal: 1100,
    tooltip: 1200,
    notification: 1300,
  },
};

// Classes Tailwind customizadas
export const premiumClasses = {
  // Backgrounds
  bgPrimary: 'bg-black',
  bgSecondary: 'bg-gray-950',
  bgSurface: 'bg-slate-800/30',
  bgGlass: 'bg-white/5 backdrop-blur-md',
  
  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-gray-300',
  textMuted: 'text-gray-500',
  textGold: 'text-yellow-400',
  
  // Borders
  borderGlow: 'border border-yellow-400/30 shadow-[0_0_20px_rgba(255,215,0,0.3)]',
  borderNeon: 'border border-blue-400/30 shadow-[0_0_20px_rgba(0,191,255,0.3)]',
  
  // Gradients
  gradientTitle: 'bg-gradient-to-r from-orange-500 via-yellow-500 to-pink-500 bg-clip-text text-transparent',
  gradientButton: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  gradientCard: 'bg-gradient-to-br from-slate-800/50 to-slate-900/50',
  
  // Animations
  pulseGlow: 'animate-pulse shadow-[0_0_20px_rgba(255,215,0,0.4)]',
  bounce: 'animate-bounce',
  fadeIn: 'animate-fade-in',
  
  // Hover effects
  hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300',
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverBrightness: 'hover:brightness-110 transition-all duration-200',
};

// Função para criar classes de cor dinâmicas
export const createColorClass = (color: string, property: 'bg' | 'text' | 'border' = 'bg') => {
  const colorMap = {
    gold: 'yellow-400',
    blue: 'blue-400',
    pink: 'pink-400',
    green: 'green-400',
    red: 'red-400',
  };
  
  const tailwindColor = colorMap[color as keyof typeof colorMap] || color;
  return `${property}-${tailwindColor}`;
};

// Componente de estilo global
export const GlobalPremiumStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@300;400;500;600&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a2e 100%);
      color: #ffffff;
      min-height: 100vh;
    }
    
    /* Scrollbar personalizada */
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #1a1a2e;
    }
    
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #FFA500, #FFD700);
    }
    
    /* Animações customizadas */
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 0.5s ease-out;
    }
    
    @keyframes glow-pulse {
      0%, 100% {
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
      }
      50% {
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
      }
    }
    
    .animate-glow-pulse {
      animation: glow-pulse 2s ease-in-out infinite;
    }
    
    /* Glass effect */
    .glass-effect {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Neon glow effect */
    .neon-glow {
      text-shadow: 0 0 10px currentColor;
    }
    
    /* Premium card effect */
    .premium-card {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 1px solid rgba(255, 215, 0, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .premium-card:hover {
      border-color: rgba(255, 215, 0, 0.4);
      box-shadow: 0 12px 40px rgba(255, 215, 0, 0.1);
    }
  `}</style>
);

export default premiumTheme;
