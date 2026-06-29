module.exports = {
  apps: [
    {
      name: "busca-formula",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "C:\\busca-formula",
      env: {
        NODE_ENV: "production",
        PASTA_RELATORIOS: "C:\\Medicator\\ARQ",
      },
    },
  ],
};
