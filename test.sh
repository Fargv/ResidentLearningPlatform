#!/bin/bash

# Script para probar el sistema de autenticación y funcionalidades principales
# Este script realiza pruebas automatizadas para verificar el correcto funcionamiento
# de la plataforma de formación en tecnologías del robot da Vinci

echo "Iniciando pruebas del sistema..."

# Directorio base del repositorio
# Calcular la ruta absoluta de este script para que
# pueda ejecutarse desde cualquier directorio
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
API_URL="http://localhost:5000/api"

# Iniciar el servidor backend en segundo plano
echo "Iniciando servidor backend..."
cd "$PROJECT_ROOT"
node src/server.js > backend.log 2>&1 &
BACKEND_PID=$!

# Esperar a que el servidor esté listo
sleep 5

# Función para realizar peticiones HTTP
function make_request() {
  METHOD=$1
  ENDPOINT=$2
  DATA=$3
  TOKEN=$4
  
  if [ -z "$DATA" ]; then
    if [ -z "$TOKEN" ]; then
      curl -s -X $METHOD $API_URL$ENDPOINT
    else
      curl -s -X $METHOD -H "Authorization: Bearer $TOKEN" $API_URL$ENDPOINT
    fi
  else
    if [ -z "$TOKEN" ]; then
      curl -s -X $METHOD -H "Content-Type: application/json" -d "$DATA" $API_URL$ENDPOINT
    else
      curl -s -X $METHOD -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$DATA" $API_URL$ENDPOINT
    fi

}

# Prueba 1: Crear un administrador inicial
echo "Prueba 1: Creando administrador inicial..."
ADMIN_DATA='{"nombre":"Admin","apellidos":"Test","email":"admin@test.com","password":"password123","rol":"administrador"}'
ADMIN_RESULT=$(make_request "POST" "/users" "$ADMIN_DATA")
echo "Resultado: $ADMIN_RESULT"

# Prueba 2: Login como administrador
echo "Prueba 2: Login como administrador..."
LOGIN_DATA='{"email":"admin@test.com","password":"password123"}'
LOGIN_RESULT=$(make_request "POST" "/auth/login" "$LOGIN_DATA")
ADMIN_TOKEN=$(echo $LOGIN_RESULT | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token obtenido: $ADMIN_TOKEN"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Error: No se pudo obtener token de administrador"
  kill $BACKEND_PID
  exit 1
fi

# Prueba 3: Obtener perfil del administrador
echo "Prueba 3: Obteniendo perfil del administrador..."
PROFILE_RESULT=$(make_request "GET" "/auth/me" "" "$ADMIN_TOKEN")
echo "Resultado: $PROFILE_RESULT"

# Prueba 4: Crear un hospital
echo "Prueba 4: Creando hospital..."
HOSPITAL_DATA='{"nombre":"Hospital Test","direccion":"Calle Test 123","ciudad":"Madrid","provincia":"Madrid","codigoPostal":"28001","telefono":"912345678","email":"hospital@test.com"}'
HOSPITAL_RESULT=$(make_request "POST" "/hospitals" "$HOSPITAL_DATA" "$ADMIN_TOKEN")
HOSPITAL_ID=$(echo $HOSPITAL_RESULT | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "ID del hospital: $HOSPITAL_ID"

# Prueba 5: Crear una fase
echo "Prueba 5: Creando fase..."
FASE_DATA='{"numero":1,"nombre":"Fase de Prueba","descripcion":"Esta es una fase de prueba"}'
FASE_RESULT=$(make_request "POST" "/fases" "$FASE_DATA" "$ADMIN_TOKEN")
FASE_ID=$(echo $FASE_RESULT | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "ID de la fase: $FASE_ID"

# Prueba 6: Crear una actividad
echo "Prueba 6: Creando actividad..."
ACTIVIDAD_DATA="{\"nombre\":\"Actividad de Prueba\",\"descripcion\":\"Esta es una actividad de prueba\",\"tipo\":\"teorica\",\"fase\":\"$FASE_ID\",\"orden\":1}"
ACTIVIDAD_RESULT=$(make_request "POST" "/actividades" "$ACTIVIDAD_DATA" "$ADMIN_TOKEN")
ACTIVIDAD_ID=$(echo $ACTIVIDAD_RESULT | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
echo "ID de la actividad: $ACTIVIDAD_ID"

# Prueba 7: Invitar a un formador
echo "Prueba 7: Invitando a un formador..."
FORMADOR_DATA="{\"nombre\":\"Formador\",\"apellidos\":\"Test\",\"email\":\"formador@test.com\",\"rol\":\"formador\",\"hospital\":\"$HOSPITAL_ID\"}"
FORMADOR_RESULT=$(make_request "POST" "/users/invite" "$FORMADOR_DATA" "$ADMIN_TOKEN")
echo "Resultado: $FORMADOR_RESULT"

# Prueba 8: Invitar a un residente
echo "Prueba 8: Invitando a un residente..."
RESIDENTE_DATA="{\"nombre\":\"Residente\",\"apellidos\":\"Test\",\"email\":\"residente@test.com\",\"rol\":\"residente\",\"hospital\":\"$HOSPITAL_ID\"}"
RESIDENTE_RESULT=$(make_request "POST" "/users/invite" "$RESIDENTE_DATA" "$ADMIN_TOKEN")
echo "Resultado: $RESIDENTE_RESULT"

# Prueba 9: Obtener lista de usuarios
echo "Prueba 9: Obteniendo lista de usuarios..."
USERS_RESULT=$(make_request "GET" "/users" "" "$ADMIN_TOKEN")
echo "Número de usuarios: $(echo $USERS_RESULT | grep -o '"data":\[.*\]' | grep -o '\[.*\]' | grep -o '{' | wc -l)"

# Prueba 10: Obtener lista de hospitales
echo "Prueba 10: Obteniendo lista de hospitales..."
HOSPITALS_RESULT=$(make_request "GET" "/hospitals" "" "$ADMIN_TOKEN")
echo "Número de hospitales: $(echo $HOSPITALS_RESULT | grep -o '"data":\[.*\]' | grep -o '\[.*\]' | grep -o '{' | wc -l)"

# Prueba 11: Obtener lista de fases
echo "Prueba 11: Obteniendo lista de fases..."
FASES_RESULT=$(make_request "GET" "/fases" "" "$ADMIN_TOKEN")
echo "Número de fases: $(echo $FASES_RESULT | grep -o '"data":\[.*\]' | grep -o '\[.*\]' | grep -o '{' | wc -l)"

# Prueba 12: Obtener lista de actividades
echo "Prueba 12: Obteniendo lista de actividades..."
ACTIVIDADES_RESULT=$(make_request "GET" "/actividades" "" "$ADMIN_TOKEN")
echo "Número de actividades: $(echo $ACTIVIDADES_RESULT | grep -o '"data":\[.*\]' | grep -o '\[.*\]' | grep -o '{' | wc -l)"

# Detener el servidor backend
echo "Deteniendo servidor backend..."
kill $BACKEND_PID

echo "Pruebas completadas."
