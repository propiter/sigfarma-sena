#!/bin/bash
echo "Iniciando SIGFARMA-SENA..."
cd "$(dirname "$0")"
docker-compose up -d
sleep 5
open http://localhost:3000 || xdg-open http://localhost:3000
echo "Sistema iniciado en tu navegador."