\#!/usr/bin/env bash
set -e

# 1) Cria barrel de páginas públicas

cat > src/pages/index.jsx << 'EOF'
export { default as LandingPage } from './LandingPage';
export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as FAQ } from './FAQ';
export { default as PoliticaPrivacidade } from './PoliticaPrivacidade';
export { default as Terms } from './Terms';
export { default as NotFound } from './NotFound';
EOF

# 2) Cria barrel de painel (usuário)

cat > src/pages/painel/index.jsx << 'EOF'
export { default as PainelLayout } from './PainelLayout';
export { default as Dashboard } from './Dashboard';
export { default as Plano } from './Plano';
export { default as Riscos } from './Riscos';
export { default as Configuracoes } from './Configuracoes';
export { default as Extrato } from './Extrato';
export { default as Sinais } from './Sinais';
EOF

# 3) Cria barrel de afiliado

cat > src/pages/afiliado/index.jsx << 'EOF'
export { default as AffiliateDashboard } from './Dashboard';
export { default as AffiliateExtrato } from './Extrato';
export { default as AffiliateConvite } from './Convite';
export { default as AffiliateSaque } from './Saque';
EOF

# 4) Cria barrel de admin

cat > src/pages/admin/index.jsx << 'EOF'
export { default as AdminDashboard } from './Dashboard';
export { default as Operacoes } from './Operacoes';
export { default as Alertas } from './Alertas';
export { default as Financeiro } from './Financeiro';
export { default as Usuarios } from './Usuarios';
export { default as Afiliados } from './Afiliados';
export { default as Parametros } from './Parametros';
EOF

# 5) Atualiza imports em src/App.jsx para usar barrels

sed -i "/Páginas públicas/,/Área do Usuário/{
s|import LandingPage.\*|import { LandingPage, Login, Register, FAQ, PoliticaPrivacidade, Terms, NotFound } from './pages';|
}
" src/App.jsx

sed -i "/Área do Usuário/,/Painel de Afiliado/{
s|import PainelLayout.\*|import { PainelLayout, Dashboard as UserDashboard, Plano, Riscos, Configuracoes, Extrato as UserExtrato, Sinais } from './pages/painel';|
}
" src/App.jsx

sed -i "/Painel de Afiliado/,/Painel de Admin/{
s|import AffiliateLayout.*|import { AffiliateLayout } from './layout/AffiliateLayout';|
s|import AffiliateDashboard.*|import { AffiliateDashboard, AffiliateExtrato, AffiliateConvite, AffiliateSaque } from './pages/afiliado';|
}
" src/App.jsx

sed -i "/Painel de Admin/,/export default function App/{
s|import AdminLayout.*|import { AdminLayout } from './layout/AdminLayout';|
s|import AdminDashboard.*|import { AdminDashboard, Operacoes, Alertas, Financeiro, Usuarios, Afiliados, Parametros } from './pages/admin';|
}
" src/App.jsx

echo "Barrels criados e App.jsx atualizado com sucesso!"
