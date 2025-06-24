"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendReport = sendReport;
async function sendReport(type) {
  // type: 'asia_open', 'asia_close', 'us_macro'
  console.log(`[Report] sendReport called for ${type}`);
  // implementar geração/envio de e-mail ou mensagem aqui
}