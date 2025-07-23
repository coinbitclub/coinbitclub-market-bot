import { NextPage } from 'next';

const TestPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-4 text-4xl font-bold">
        ✅ Frontend Funcionando!
      </h1>
      <p className="text-lg text-gray-300">
        Esta página confirma que o Tailwind CSS e os componentes estão funcionando corretamente.
      </p>
      <div className="mt-8 rounded-lg bg-gray-800 p-4">
        <h2 className="mb-2 text-2xl font-semibold">Status do Sistema:</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="mr-3 size-3 rounded-full bg-green-500"></span>
            Frontend Next.js
          </li>
          <li className="flex items-center">
            <span className="mr-3 size-3 rounded-full bg-green-500"></span>
            Tailwind CSS
          </li>
          <li className="flex items-center">
            <span className="mr-3 size-3 rounded-full bg-green-500"></span>
            Componentes React
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;
