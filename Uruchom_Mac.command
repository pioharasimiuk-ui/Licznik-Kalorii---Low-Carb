#!/bin/bash
cd "$(dirname "$0")"
echo "======================================================="
echo "Uruchamianie Twojego Dziennika Kalorii i Nawodnienia..."
echo "======================================================="
echo ""
echo "[1/2] Instalowanie/sprawdzanie potrzebnych pakietów..."
npm install
echo ""
echo "[2/2] Uruchamianie lokalnego serwera..."
echo "Aplikacja otworzy się w Twojej przeglądarce internetowej."
echo "Nie zamykaj tego okna podczas korzystania z aplikacji!"
echo ""
open http://localhost:3000
npm run dev
