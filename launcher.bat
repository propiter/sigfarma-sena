@echo off
echo Iniciando SIGFARMA-SENA...
cd /d %~dp0
docker-compose up -d
timeout /t 5 /nobreak >nul
start http://localhost:3000
echo Sistema iniciado en tu navegador.