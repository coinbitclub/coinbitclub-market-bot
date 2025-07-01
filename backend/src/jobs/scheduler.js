import saldoCheckJob from "./saldoCheckJob.js";
// Importe outros jobs aqui se quiser adicionar mais

// Executa os jobs agendados
export default function runAllJobs() {
  // Exemplo: Checagem de saldo e notificações a cada 5 minutos
  setInterval(() => {
    console.log("Executando job: Checagem de saldo pré-pago dos usuários...");
    saldoCheckJob();
  }, 5 * 60 * 1000);

  // Adicione mais jobs recorrentes aqui, se quiser...
  // setInterval(() => {...}, ...);
}

// Roda todos ao iniciar este arquivo
runAllJobs();
