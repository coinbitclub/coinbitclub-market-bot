import bcrypt from 'bcryptjs';

const senha = 'Apelido22@13';

bcrypt.hash(senha, 10).then(hash => {
  console.log('HASH GERADO:', hash);
});
