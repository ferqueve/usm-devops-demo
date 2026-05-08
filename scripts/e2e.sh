#!/usr/bin/env bash
# Orquestador de pruebas extremo a extremo con Playwright.
#
# Levanta Postgres + Redis dedicados (docker-compose.e2e.yml), arranca el
# backend con perfil e2e (que siembra datos en el primer arranque), arranca
# el frontend de Vite contra ese backend y corre Playwright. Apaga todo al
# salir, incluso ante fallo.
#
# Uso:
#   scripts/e2e.sh                   # corrida completa
#   scripts/e2e.sh --keep-running    # deja servicios arriba al terminar (debug)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.e2e.yml"
LOG_DIR="$ROOT/.e2e-logs"
mkdir -p "$LOG_DIR"

KEEP_RUNNING=false
if [[ "${1:-}" == "--keep-running" ]]; then
  KEEP_RUNNING=true
  shift
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  local exit_code=$?
  if [[ "$KEEP_RUNNING" == "true" && $exit_code -eq 0 ]]; then
    echo
    echo "=== Servicios siguen arriba (--keep-running) ==="
    echo "  Backend  : http://localhost:8080  (PID $BACKEND_PID)"
    echo "  Frontend : http://localhost:5173  (PID $FRONTEND_PID)"
    echo "  DB       : postgres en :5433"
    echo "Para apagar: kill $BACKEND_PID $FRONTEND_PID && docker compose -f $COMPOSE_FILE down -v"
    exit 0
  fi
  echo
  echo "=== Limpiando ==="
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

wait_port() {
  local host="$1"
  local port="$2"
  local name="$3"
  local timeout="${4:-90}"
  echo -n "Esperando $name en $host:$port "
  for i in $(seq 1 "$timeout"); do
    if (echo > "/dev/tcp/$host/$port") 2>/dev/null; then
      echo " ✓ (${i}s)"
      return 0
    fi
    echo -n "."
    sleep 1
  done
  echo " ✗ timeout"
  return 1
}

echo "=== 1/4 · Levantando Postgres + Redis para E2E ==="
docker compose -f "$COMPOSE_FILE" up -d
echo -n "Esperando que la base esté healthy "
for i in $(seq 1 30); do
  if [[ "$(docker inspect --format='{{.State.Health.Status}}' utec_e2e_db 2>/dev/null)" == "healthy" ]]; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 1
done

echo "=== 2/4 · Arrancando backend (perfil e2e) ==="
(
  cd "$ROOT/backend"
  SPRING_PROFILES_ACTIVE=e2e mvn -q spring-boot:run -DskipTests
) > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
wait_port localhost 8080 "backend" 120

echo "=== 3/4 · Arrancando frontend (Vite) ==="
(
  cd "$ROOT/frontend"
  VITE_API_URL=http://localhost:8080/api/v1 npm run dev
) > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
wait_port localhost 5173 "frontend" 60

echo "=== 4/4 · Corriendo Playwright ==="
cd "$ROOT/frontend"
npx playwright test "$@"
