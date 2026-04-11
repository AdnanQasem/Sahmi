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

The frontend expects `http://localhost:8000/api/v1/`.

Core endpoints: `auth/register/`, `auth/login/`, `auth/refresh-token/`, `auth/me/`, `projects/`, `categories/`, `investments/`, `milestones/`, `repayments/`, and `/api/docs/`.
