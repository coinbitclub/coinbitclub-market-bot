import { createGlobalStyle } from 'styled-components';

export const GlobalPremiumStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
    background: linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%);
    color: #ffffff;
    overflow-x: hidden;
  }

  body {
    min-height: 100vh;
    background-attachment: fixed;
  }

  /* Scrollbar customization */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #FFD700, #FFA500);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #FFA500, #FF6B6B);
  }

  /* Custom loading animation */
  @keyframes premiumGlow {
    0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
    50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 165, 0, 0.6); }
    100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
  }

  .premium-glow {
    animation: premiumGlow 2s ease-in-out infinite;
  }

  /* Button hover effects */
  .premium-button {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .premium-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .premium-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }

  .premium-button:hover::before {
    left: 100%;
  }

  /* Card hover effects */
  .premium-card {
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 215, 0, 0.1);
  }

  .premium-card:hover {
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
    transform: translateY(-5px);
  }

  /* Text gradient animations */
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .animated-gradient {
    background: linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FECA57);
    background-size: 400% 400%;
    animation: gradientShift 3s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .premium-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .premium-text-large {
      font-size: 1.5rem;
    }
    
    .premium-padding {
      padding: 1rem;
    }
  }

  /* Loading states */
  .premium-loading {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.3) 50%, rgba(255, 215, 0, 0.1) 100%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
  }

  @keyframes loading {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Form styles */
  .premium-input {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 215, 0, 0.2);
    border-radius: 12px;
    padding: 12px 16px;
    color: white;
    transition: all 0.3s ease;
  }

  .premium-input:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
  }

  .premium-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  /* Navigation styles */
  .premium-nav {
    backdrop-filter: blur(10px);
    background: rgba(0, 0, 0, 0.8);
    border-bottom: 1px solid rgba(255, 215, 0, 0.1);
  }

  /* Status indicators */
  .status-online {
    background: linear-gradient(135deg, #10B981, #059669);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }

  .status-offline {
    background: linear-gradient(135deg, #EF4444, #DC2626);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
  }

  .status-pending {
    background: linear-gradient(135deg, #F59E0B, #D97706);
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
  }
`;

export default GlobalPremiumStyles;
