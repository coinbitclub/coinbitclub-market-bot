const { query } = require('./src/lib/database.ts');

async function checkUserRole() {
  try {
    console.log('🔍 Verificando role do usuário de teste...');
    
    const result = await query(
      'SELECT email, role, name, status FROM users WHERE email = $1', 
      ['faleconosco@coinbitclub.vip']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('👤 Usuário encontrado:');
      console.log('  📧 Email:', user.email);
      console.log('  👔 Role:', user.role);
      console.log('  📝 Nome:', user.name);
      console.log('  ✅ Status:', user.status);
      
      // Mostrar onde deveria redirecionar
      switch (user.role.toLowerCase()) {
        case 'admin':
          console.log('  🎯 Deveria redirecionar para: /admin/dashboard');
          break;
        case 'affiliate':
        case 'afiliado':
          console.log('  🎯 Deveria redirecionar para: /affiliate/dashboard');
          break;
        case 'gestor':
        case 'manager':
          console.log('  🎯 Deveria redirecionar para: /gestor/dashboard');
          break;
        case 'operador':
        case 'operator':
          console.log('  🎯 Deveria redirecionar para: /operador/dashboard');
          break;
        case 'user':
        case 'usuario':
        default:
          console.log('  🎯 Deveria redirecionar para: /user/dashboard');
          break;
      }
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkUserRole();
