// Script para verificar e atualizar telefone do usuário faleconosco@coinbitclub.vip
// Execute: node update-phone-faleconosco.js

import { db } from './backend/common/db.js';

async function updateFaleconoscoPhone() {
  console.log('🔍 VERIFICANDO USUÁRIO FALECONOSCO');
  console.log('=================================');
  
  try {
    // Verificar se usuário existe
    const user = await db('users').where({ email: 'faleconosco@coinbitclub.vip' }).first();
    
    if (!user) {
      console.log('❌ Usuário faleconosco@coinbitclub.vip não encontrado');
      console.log('📝 Criando usuário...');
      
      // Criar usuário se não existir
      const newUser = await db('users').insert({
        email: 'faleconosco@coinbitclub.vip',
        name: 'Fale Conosco',
        phone: '5521987386645',
        password_hash: '$2b$12$LQv3c1yqBwlVHpPjrk6PoepMqNjdVVl8JZMR.OGa1VRqKSJJrGgIa', // password
        role: 'user',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      
      console.log('✅ Usuário criado com sucesso:');
      console.log(`   ID: ${newUser[0].id}`);
      console.log(`   Email: ${newUser[0].email}`);
      console.log(`   Telefone: ${newUser[0].phone}`);
      console.log(`   Status: ${newUser[0].status}`);
      
    } else {
      console.log('✅ Usuário encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Telefone: ${user.phone || 'NÃO CADASTRADO'}`);
      console.log(`   Status: ${user.status}`);
      
      // Verificar se telefone precisa ser atualizado
      if (!user.phone || user.phone !== '5521987386645') {
        console.log('');
        console.log('📱 ATUALIZANDO TELEFONE');
        console.log('=======================');
        
        await db('users')
          .where({ id: user.id })
          .update({
            phone: '5521987386645',
            updated_at: new Date()
          });
        
        console.log('✅ Telefone atualizado para: 5521987386645');
        
        // Verificar atualização
        const updatedUser = await db('users').where({ id: user.id }).first();
        console.log(`✅ Confirmação - Telefone atual: ${updatedUser.phone}`);
      } else {
        console.log('✅ Telefone já está correto: 5521987386645');
      }
    }
    
    console.log('');
    console.log('🎯 VERIFICAÇÃO FINAL');
    console.log('===================');
    
    const finalUser = await db('users').where({ email: 'faleconosco@coinbitclub.vip' }).first();
    console.log('📋 Dados finais do usuário:');
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Nome: ${finalUser.name}`);
    console.log(`   Telefone: ${finalUser.phone}`);
    console.log(`   Status: ${finalUser.status}`);
    console.log(`   Criado em: ${finalUser.created_at}`);
    console.log(`   Atualizado em: ${finalUser.updated_at}`);
    
    console.log('');
    console.log('✅ PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log('🔐 Usuário faleconosco@coinbitclub.vip está pronto para autenticação OTP via SMS');
    
  } catch (error) {
    console.error('❌ Erro ao verificar/atualizar usuário:', error.message);
  } finally {
    process.exit(0);
  }
}

updateFaleconoscoPhone();
