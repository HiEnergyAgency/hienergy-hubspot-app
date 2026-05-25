#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT_DIR/scripts/deploy-breeze.env}"
DEPLOY_BASE_URL="${DEPLOY_BASE_URL:-https://app.hienergy.ai}"
RENDER_SERVICE_NAME="${RENDER_SERVICE_NAME:-hienergy-hubspot-breeze}"
DOCKER_IMAGE="${DOCKER_IMAGE:-hienergy-hubspot-breeze:local}"

usage() {
  cat <<'EOF'
Deploy the Hi Energy HubSpot breeze webhook service.

Usage:
  ./scripts/deploy-breeze.sh render [--skip-tests]
  ./scripts/deploy-breeze.sh docker [build|run|push]
  ./scripts/deploy-breeze.sh verify
  ./scripts/deploy-breeze.sh local

Commands:
  render   Validate render.yaml, create/update Render service, trigger deploy
  docker   Build/run/push the Docker image defined in breeze/Dockerfile
  verify   Check /health and /integrations/hubspot on DEPLOY_BASE_URL
  local    Run breeze/server.js locally using scripts/deploy-breeze.env

Environment:
  DEPLOY_ENV_FILE     Path to env file (default: scripts/deploy-breeze.env)
  DEPLOY_BASE_URL     Public base URL (default: https://app.hienergy.ai)
  RENDER_SERVICE_NAME Render service name from render.yaml

Before first Render deploy, set secrets in the Render dashboard:
  HUBSPOT_CLIENT_SECRET, HUBSPOT_CLIENT_ID
  HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL / TOKEN (optional)
Then map app.hienergy.ai routes to the Render service:
  /hubspot/*, /integrations/hubspot, /health
EOF
}

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "$ENV_FILE"
    set +a
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_env() {
  local missing=0
  for key in "$@"; do
    if [[ -z "${!key:-}" ]]; then
      echo "Missing required env var: $key" >&2
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    echo "Copy scripts/deploy-breeze.env.example to scripts/deploy-breeze.env and fill values." >&2
    exit 1
  fi
}

run_tests() {
  echo "Running tests..."
  npm test
}

deploy_render() {
  local skip_tests="${1:-}"

  require_cmd render
  require_cmd git

  if [[ "$skip_tests" != "--skip-tests" ]]; then
    run_tests
  fi

  if ! render whoami -o json >/dev/null 2>&1; then
    echo "Render CLI is not authenticated. Run: render login" >&2
    exit 1
  fi

  echo "Validating render.yaml..."
  render blueprints validate render.yaml -o text

  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Warning: you have uncommitted changes. Push to GitHub before deploying." >&2
  fi

  local service_id
  service_id="$(render services -o json 2>/dev/null | node -e "
    const services = JSON.parse(require('fs').readFileSync(0, 'utf8') || '[]');
    const match = services.find((entry) => entry.service?.name === process.env.RENDER_SERVICE_NAME);
    process.stdout.write(match?.service?.id || '');
  " || true)"

  if [[ -z "$service_id" ]]; then
    echo "Creating Render service $RENDER_SERVICE_NAME ..."
    service_id="$(render services create \
      --name "$RENDER_SERVICE_NAME" \
      --type web_service \
      --runtime node \
      --repo https://github.com/HiEnergyAgency/hienergy-hubspot-app \
      --branch main \
      --build-command "npm ci" \
      --start-command "node breeze/server.js" \
      --health-check-path /health \
      --plan starter \
      --environment-id "${RENDER_ENVIRONMENT_ID:-evm-d6spgnv5r7bs7398sldg}" \
      --env-var "NODE_VERSION=20" \
      --env-var "HUBSPOT_REDIRECT_URI=https://app.hienergy.ai/hubspot/oauth/callback" \
      --env-var "HIENERGY_API_BASE=https://app.hienergy.ai/api/v1" \
      --env-var "HIENERGY_HUBSPOT_PORTAL_STORE=/tmp/hubspot-portals.json" \
      --confirm -o json | node -e "
        const payload = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        process.stdout.write(payload.id || payload.service?.id || '');
      ")"
  fi

  if [[ -z "$service_id" ]]; then
    echo "Could not resolve Render service ID for $RENDER_SERVICE_NAME" >&2
    exit 1
  fi

  echo "Triggering deploy for $service_id ..."
  render deploys create "$service_id" --confirm --wait -o text

  cat <<EOF

Deploy triggered for service "$RENDER_SERVICE_NAME" ($service_id).

Set these secret env vars in Render if you have not already:
  HUBSPOT_CLIENT_SECRET
  HUBSPOT_CLIENT_ID

Then route app.hienergy.ai paths to the service URL:
  /hubspot/*, /integrations/hubspot, /health

Run: ./scripts/deploy-breeze.sh verify
EOF
}

docker_build() {
  require_cmd docker
  echo "Building $DOCKER_IMAGE ..."
  docker build -f breeze/Dockerfile -t "$DOCKER_IMAGE" .
}

docker_run() {
  load_env
  require_env HUBSPOT_CLIENT_SECRET HUBSPOT_CLIENT_ID
  docker_build

  echo "Starting container on http://127.0.0.1:8787 ..."
  docker run --rm -p 8787:8787 \
    -e HUBSPOT_CLIENT_SECRET \
    -e HUBSPOT_CLIENT_ID \
    -e HUBSPOT_REDIRECT_URI="${HUBSPOT_REDIRECT_URI:-https://app.hienergy.ai/hubspot/oauth/callback}" \
    -e HIENERGY_API_BASE="${HIENERGY_API_BASE:-https://app.hienergy.ai/api/v1}" \
    -e HIENERGY_HUBSPOT_PORTAL_STORE="${HIENERGY_HUBSPOT_PORTAL_STORE:-/tmp/hubspot-portals.json}" \
    -e HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL="${HIENERGY_HUBSPOT_PORTAL_LOOKUP_URL:-}" \
    -e HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN="${HIENERGY_HUBSPOT_PORTAL_LOOKUP_TOKEN:-}" \
    "$DOCKER_IMAGE"
}

docker_push() {
  require_cmd docker
  docker_build
  echo "Pushing $DOCKER_IMAGE ..."
  docker push "$DOCKER_IMAGE"
}

deploy_verify() {
  require_cmd curl
  local base="${DEPLOY_BASE_URL%/}"

  echo "Checking $base/health ..."
  curl -fsS "$base/health" | tee /dev/stderr
  echo

  echo "Checking $base/integrations/hubspot ..."
  curl -fsS "$base/integrations/hubspot" | head -n 5
  echo
  echo "... setup guide HTML looks good."

  echo
  echo "Manual checks (POST routes need HubSpot signatures):"
  echo "  - Connected apps → Hi Energy AI → Settings → Save and test connection"
  echo "  - Company/contact CRM cards return Hi Energy results"
}

deploy_local() {
  load_env
  require_env HUBSPOT_CLIENT_SECRET HUBSPOT_CLIENT_ID
  export PORT="${PORT:-8787}"
  echo "Starting local breeze server on http://127.0.0.1:$PORT ..."
  node breeze/server.js
}

main() {
  local command="${1:-}"
  shift || true

  case "$command" in
    render)
      deploy_render "${1:-}"
      ;;
    docker)
      local action="${1:-build}"
      case "$action" in
        build) docker_build ;;
        run) docker_run ;;
        push) docker_push ;;
        *)
          echo "Unknown docker action: $action (use build|run|push)" >&2
          exit 1
          ;;
      esac
      ;;
    verify)
      deploy_verify
      ;;
    local)
      deploy_local
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      echo "Unknown command: $command" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
