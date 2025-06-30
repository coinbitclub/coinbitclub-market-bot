import { exec } from "child_process";

exec('find . -type f', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('=== LISTA DE ARQUIVOS NO CONTAINER ===\n', stdout);
});
