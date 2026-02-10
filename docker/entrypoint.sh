#!/bin/sh
set -eu

TEMPLATE_PATH=${CONFIG_TEMPLATE:-/app/config.template.yml}
OUTPUT_PATH=${CONFIG_PATH:-/app/config.yml}

if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "Config template not found at $TEMPLATE_PATH" >&2
  exit 1
fi

if [ -z "${SUBSTRATE_NODE_URL:-}" ]; then
  echo "Missing required env var: SUBSTRATE_NODE_URL" >&2
  exit 1
fi

: "${RPC_ETHEREUM:=https://eth.llamarpc.com}"
: "${RPC_BASE:=https://base.llamarpc.com}"
: "${RPC_POLYGON:=https://polygon-bor-rpc.publicnode.com}"

rendered=$(cat "$TEMPLATE_PATH")
for var in SUBSTRATE_NODE_URL RPC_ETHEREUM RPC_BASE RPC_POLYGON; do
  val=$(printenv "$var")
  rendered=$(printf '%s' "$rendered" | sed "s|__${var}__|$val|g")
done

printf '%s\n' "$rendered" > "$OUTPUT_PATH"

if [ -n "${INTERVAL_SECONDS:-}" ]; then
  case " $* " in
    *" --interval "*) : ;;
    *) set -- "$@" --interval "$INTERVAL_SECONDS" ;;
  esac
fi

exec "$@"
