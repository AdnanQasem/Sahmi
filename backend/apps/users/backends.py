from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class CaseInsensitiveEmailBackend(ModelBackend):
    """Authenticate email addresses without treating letter case as significant."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        email = username or kwargs.get(UserModel.USERNAME_FIELD)
        if not email or password is None:
            return None

        try:
            user = UserModel._default_manager.get(email__iexact=email.strip())
        except UserModel.DoesNotExist:
            # Match Django's default backend timing behavior for unknown users.
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
