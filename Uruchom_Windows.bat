@echo off
echo =======================================================
echo Uruchamianie Twojego Dziennika Kalorii i Nawodnienia...
echo =======================================================
echo.
echo [1/2] Instalowanie/sprawdzanie potrzebnych pakietow...
call npm install
echo.
echo [2/2] Uruchamianie lokalnego serwera...
echo Aplikacja otworzy sie w Twojej przegladarce internetowej.
echo Nie zamykaj tego okna podczas korzystania z aplikacji!
echo.
start http://localhost:3000
call npm run dev
pause
