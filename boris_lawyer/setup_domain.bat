@echo off
chcp 65001 >nul
rem Привязывает домены boris_lawyer и boris-lawyer.local к этому компьютеру.
rem Запускать от имени администратора (ПКМ -> Запуск от имени администратора).
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Нужны права администратора. Кликните правой кнопкой -^> "Запуск от имени администратора".
  pause
  exit /b 1
)
set HOSTS=%SystemRoot%\System32\drivers\etc\hosts
findstr /C:"boris_lawyer site" "%HOSTS%" >nul
if %errorlevel%==0 (
  echo Домены уже настроены.
) else (
  copy /Y "%HOSTS%" "%HOSTS%.bak" >nul
  echo.>> "%HOSTS%"
  echo 127.0.0.1 boris_lawyer boris-lawyer.local www.boris-lawyer.local # boris_lawyer site>> "%HOSTS%"
  ipconfig /flushdns >nul
  echo Готово.
)
echo Откройте: http://boris_lawyer:8080  или  http://boris-lawyer.local:8080
pause
