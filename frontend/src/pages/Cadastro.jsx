import React from "react";

export default function Cadastro() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-light p-8 rounded-xl shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-dark">Cadastro</h2>
        {/* Aqui virá o formulário de cadastro */}
        <form>
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Nome completo" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="email" placeholder="Email" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="password" placeholder="Senha" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="password" placeholder="Confirme sua senha" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Telefone" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="CPF" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Endereço" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Número" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Bairro" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Cidade" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="Estado" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="text" placeholder="País" />
          <div className="flex items-center mb-4">
            <input type="checkbox" id="termos" className="mr-2" required />
            <label htmlFor="termos" className="text-sm text-dark">Li e concordo com os <a href="/termos" className="text-primary underline">Termos de Uso</a></label>
          </div>
          <button className="w-full bg-primary text-white font-semibold py-3 rounded-lg mt-2 hover:bg-accent transition">Cadastrar</button>
        </form>
        <div className="mt-4 text-sm text-center">
          Já tem conta? <a href="/login" className="text-primary hover:underline">Entrar</a>
        </div>
      </div>
    </div>
  );
}
