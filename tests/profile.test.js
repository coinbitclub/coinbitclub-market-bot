// test/profile.test.js
import request from 'supertest';
import app from '../src/index.js';
import 'dotenv/config';

async function run() {
  // 1) Faz login e extrai token
  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: 'erica@test.com', password: 'Senha123!' });
  if (loginRes.status !== 200) {
    console.error('❌ Login falhou:', loginRes.status, loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.token;

  // 2) Chama /user/profile com o JWT
  const profileRes = await request(app)
    .get('/user/profile')
    .set('Authorization', `Bearer ${token}`);

  console.log('Status:', profileRes.status);
  console.log('Body:', profileRes.body);

  process.exit(profileRes.status === 200 ? 0 : 1);
}

run();
