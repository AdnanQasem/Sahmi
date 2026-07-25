from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import config

BASE_DIR = Path(__file__).resolve().parents[2]

SECRET_KEY = config("DJANGO_SECRET_KEY", default="dev-only-change-me")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",
    "apps.core",
    "apps.users",
    "apps.projects",
    "apps.investments",
    "apps.notifications",
    "apps.messaging",
    "apps.audit",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RequestIDMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
    )
}

AUTH_USER_MODEL = "users.User"
AUTHENTICATION_BACKENDS = [
    "apps.users.backends.CaseInsensitiveEmailBackend",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config(
        "DJANGO_CORS_ALLOWED_ORIGINS",
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_TYPE_CLAIM": "access",
}

# Throttling
from datetime import timedelta as _td  # noqa: E402
ANON_THROTTLE_RATE = config("DJANGO_ANON_THROTTLE_RATE", default="60/min")
USER_THROTTLE_RATE = config("DJANGO_USER_THROTTLE_RATE", default="180/min")
LOGIN_THROTTLE_RATE = config("DJANGO_LOGIN_THROTTLE_RATE", default="5/min")
REGISTER_THROTTLE_RATE = config("DJANGO_REGISTER_THROTTLE_RATE", default="3/min")
REFRESH_THROTTLE_RATE = config("DJANGO_REFRESH_THROTTLE_RATE", default="10/min")
PASSWORD_CHANGE_THROTTLE_RATE = config("DJANGO_PASSWORD_CHANGE_THROTTLE_RATE", default="5/hour")
PASSWORD_RESET_THROTTLE_RATE = config("DJANGO_PASSWORD_RESET_THROTTLE_RATE", default="5/hour")
MESSAGE_SEND_THROTTLE_RATE = config("DJANGO_MESSAGE_SEND_THROTTLE_RATE", default="30/min")
CONVERSATION_CREATE_THROTTLE_RATE = config("DJANGO_CONVERSATION_CREATE_THROTTLE_RATE", default="10/hour")
NOTIFICATION_READ_THROTTLE_RATE = config("DJANGO_NOTIFICATION_READ_THROTTLE_RATE", default="120/min")
ADMIN_VERIFICATION_THROTTLE_RATE = config("DJANGO_ADMIN_VERIFICATION_THROTTLE_RATE", default="30/hour")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
    "DEFAULT_RENDERER_CLASSES": ("apps.core.renderers.StandardJSONRenderer",),
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "apps.core.throttling.AnonRateThrottle",
        "apps.core.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": ANON_THROTTLE_RATE,
        "user": USER_THROTTLE_RATE,
        "login": LOGIN_THROTTLE_RATE,
        "register": REGISTER_THROTTLE_RATE,
        "refresh": REFRESH_THROTTLE_RATE,
        "password_change": PASSWORD_CHANGE_THROTTLE_RATE,
        "password_reset": PASSWORD_RESET_THROTTLE_RATE,
        "message_send": MESSAGE_SEND_THROTTLE_RATE,
        "conversation_create": CONVERSATION_CREATE_THROTTLE_RATE,
        "notification_read": NOTIFICATION_READ_THROTTLE_RATE,
        "admin_verification": ADMIN_VERIFICATION_THROTTLE_RATE,
    },
    "EXCEPTION_HANDLER": "apps.core.exceptions.standard_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Sahmi API",
    "DESCRIPTION": "Django REST API for the Sahmi investment platform.",
    "VERSION": "1.0.0",
}


FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173").rstrip("/")
EMAIL_BACKEND = config(
    "DJANGO_EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = config("DJANGO_EMAIL_HOST", default="localhost")
EMAIL_PORT = config("DJANGO_EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("DJANGO_EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("DJANGO_EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("DJANGO_EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DJANGO_DEFAULT_FROM_EMAIL", default="Sahmi <no-reply@sahmi.local>")
CELERY_BROKER_URL = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
