#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if command -v docker >/dev/null 2>&1; then
  docker_bin="$(command -v docker)"
elif [ -x "$HOME/.docker/bin/docker" ]; then
  docker_bin="$HOME/.docker/bin/docker"
elif [ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
  docker_bin="/Applications/Docker.app/Contents/Resources/bin/docker"
else
  echo "Docker CLI not found. Install and start Docker Desktop first." >&2
  exit 1
fi

PATH="$(dirname "$docker_bin"):$PATH"
export PATH

case "${1:-up}" in
  up|restart|down|logs) action="${1:-up}" ;;
  *)
    echo "Usage: sh scripts/docker-dev.sh [up|restart|down|logs]" >&2
    exit 1
    ;;
esac

if [ ! -f .env ]; then
  echo "Missing .env. Create it using the environment configuration in README.md." >&2
  exit 1
fi

if ! "$docker_bin" info >/dev/null; then
  echo "Docker engine is unavailable. Start Docker Desktop and try again." >&2
  exit 1
fi

node scripts/docker-dev.mjs "$docker_bin" "$action"
