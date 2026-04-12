from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsEntrepreneur(BasePermission):
    message = "Only entrepreneurs can create projects."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or getattr(user, "user_type", None) == "entrepreneur"


class ProjectPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff or obj.entrepreneur_id == request.user.id
