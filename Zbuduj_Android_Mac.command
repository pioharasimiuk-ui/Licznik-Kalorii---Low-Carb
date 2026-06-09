#!/bin/bash
cd "$(dirname "$0")"
echo "======================================================="
echo "Przygotowanie i budowanie projektu na Androida..."
echo "======================================================="
echo ""

echo "[1/3] Instalowanie/sprawdzanie potrzebnych pakietów (npm install)..."
npm install

echo ""
echo "[2/3] Budowanie wersji webowej i synchronizacja (npm run mobile:build)..."
npm run mobile:build

echo ""
echo "[3/3] Próba otwarcia projektu w Android Studio..."
npx cap open android || echo "Nie udało się automatycznie otworzyć Android Studio. Możesz otworzyć je ręcznie i wskazać folder 'android'."

echo ""
echo "======================================================="
echo "Sukces! Pliki dla Androida zostały pomyślnie zbudowane."
echo "======================================================="
