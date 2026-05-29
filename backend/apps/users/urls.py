from django.urls import path

from .views import ChangePasswordView, LoginView, MeView, RefreshTokenView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh-token/", RefreshTokenView.as_view(), name="refresh-token"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]
