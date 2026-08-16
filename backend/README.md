# Sahmi Django Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

In two additional terminals, run the timeline scheduler and its worker:

```powershell
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info
```

Docker Compose starts both services automatically. The beat scheduler checks
implementation milestone dates every minute using `DJANGO_TIME_ZONE`.

The frontend expects `http://localhost:8000/api/v1/`.

Core endpoints: `auth/register/`, `auth/login/`, `auth/refresh-token/`, `auth/me/`, `projects/`, `categories/`, `investments/`, `milestones/`, `repayments/`, and `/api/docs/`.
