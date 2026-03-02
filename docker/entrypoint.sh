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

# Set defaults for RPC vars (public endpoints as fallback)
export RPC_ETHEREUM="${RPC_ETHEREUM:-https://eth.llamarpc.com}"
export RPC_BSC="${RPC_BSC:-https://bsc-dataseed.binance.org}"
export RPC_BASE="${RPC_BASE:-https://base.llamarpc.com}"
export RPC_POLYGON="${RPC_POLYGON:-https://polygon-bor-rpc.publicnode.com}"
export RPC_ARBITRUM="${RPC_ARBITRUM:-https://arb1.arbitrum.io/rpc}"
export RPC_OPTIMISM="${RPC_OPTIMISM:-https://mainnet.optimism.io}"

# Copy template — ${VAR} substitution is handled by configLoader
cp "$TEMPLATE_PATH" "$OUTPUT_PATH"

if [ -n "${INTERVAL_SECONDS:-}" ]; then
  case " $* " in
    *" --interval "*) : ;;
    *) set -- "$@" --interval "$INTERVAL_SECONDS" ;;
  esac
fi

exec "$@"
