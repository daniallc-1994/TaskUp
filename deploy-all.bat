@echo off
echo === TaskUp Deploy (web + backend) ===
echo Building web...
cd /d %~dp0web
npm run build
IF %ERRORLEVEL% NEQ 0 (
  echo Web build failed. Aborting.
  exit /b 1
)
echo Web build complete.

where vercel >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
  echo Deploying web with Vercel...
  vercel --prod
) ELSE (
  echo Vercel CLI not installed. Skipping web deploy.
)

echo Checking backend (monorepo) compile...
cd /d %~dp0backend\fastapi
python -m compileall .

echo Checking backend v1 (Render) compile...
cd /d %~dp0..\TaskUPv1
python -m compileall .

echo Git status (backend v1):
git status -sb
echo If changes exist, commit and push to redeploy Render.
echo Deployment script finished.
