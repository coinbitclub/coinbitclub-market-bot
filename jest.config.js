export default {
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',  // Usar babel-jest para arquivos JS e JSX
  },
  testEnvironment: 'node',
};
