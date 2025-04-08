#!/bin/bash

# Script para ejecutar el frontend y backend en modo desarrollo
# Este script inicia ambos servicios para pruebas locales

echo "Iniciando entorno de desarrollo..."

# Directorio base
BASE_DIR="/home/ubuntu/davinci-platform"

# Verificar si hay procesos previos ejecutándose
echo "Verificando procesos previos..."
if pgrep -f "node src/server.js" > /dev/null; then
  echo "Deteniendo servidor backend previo..."
  pkill -f "node src/server.js"
  sleep 2
fi

if pgrep -f "react-scripts start" > /dev/null; then
  echo "Deteniendo servidor frontend previo..."
  pkill -f "react-scripts start"
  sleep 2
fi

# Iniciar el servidor backend en segundo plano
echo "Iniciando servidor backend..."
cd $BASE_DIR
node src/server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Servidor backend iniciado con PID: $BACKEND_PID"

# Esperar a que el servidor backend esté listo
sleep 3
echo "Verificando estado del servidor backend..."
if curl -s http://localhost:5000/api/health > /dev/null; then
  echo "Servidor backend funcionando correctamente"
else
  echo "Error: El servidor backend no responde"
  echo "Últimas líneas del log:"
  tail -n 10 backend.log
  exit 1
fi

# Iniciar el servidor frontend en segundo plano
echo "Iniciando servidor frontend..."
cd $BASE_DIR/client
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Servidor frontend iniciado con PID: $FRONTEND_PID"

# Esperar a que el servidor frontend esté listo
sleep 10
echo "Verificando estado del servidor frontend..."
if curl -s http://localhost:3000 > /dev/null; then
  echo "Servidor frontend funcionando correctamente"
else
  echo "Error: El servidor frontend no responde"
  echo "Últimas líneas del log:"
  tail -n 10 frontend.log
  exit 1
fi

echo "Entorno de desarrollo iniciado correctamente"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Para detener los servidores, ejecute:"
echo "kill $BACKEND_PID $FRONTEND_PID"
