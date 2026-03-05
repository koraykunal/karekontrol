@echo off
set DJANGO_SETTINGS_MODULE=config.settings.development
set CELERY_BROKER_URL=redis://127.0.0.1:6379/0
set CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0

start "Celery Worker" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && celery -A config worker -l info --pool=solo"

timeout /t 2 /nobreak >nul

start "Celery Beat" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler"

exit