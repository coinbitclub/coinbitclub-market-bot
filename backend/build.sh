#!/bin/bash
echo " Custom build script executando..."
echo " Removendo package-lock.json se existir..."
rm -f package-lock.json
echo " Instalando dependências com npm install..."
npm install --no-package-lock
echo " Build concluído!"