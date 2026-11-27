#!/bin/sh
# Doble clic en Mac (o ./iniciar-mac-linux.command en Linux) para abrir Explora Chile.
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then python3 server.py; else python server.py; fi
