@echo off
echo =======================================================
echo Przygotowanie i budowanie projektu na Androida...
echo =======================================================
echo.

echo [1/3] Instalowanie/sprawdzanie potrzebnych pakietow (npm install)...
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [BLAD] Wystapil problem podczas instalacji pakietow npm.
    echo Upewnij sie, ze jestes polaczony z internetem i sprobuj ponownie.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Budowanie wersji webowej i synchronizacja (npm run mobile:build)...
call npm run mobile:build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [BLAD] Wystapil problem podczas kompilacji i synchronizacji Capacitora.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Proba otwarcia projektu w Android Studio...
echo (Musisz miec zainstalowane Android Studio na swoim komputerze)
echo.
call npx cap open android
if %ERRORLEVEL% neq 0 (
    echo.
    echo [UWAGA] Nie udalo sie automatycznie otworzyc Android Studio.
    echo Mozesz zrobic to recznie, otwierajac Android Studio
    echo i wskazujac folder "android" znajdujacy sie w glownym katalogu Twojej aplikacji.
)

echo.
echo =======================================================
echo Sukces! Pliki dla Androida zostaly pomyslnie zbudowane.
echo =======================================================
pause
