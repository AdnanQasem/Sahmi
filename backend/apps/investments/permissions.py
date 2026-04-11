from rest_framework.permissions import SAFE_METHODS, BasePermission


class InvestmentPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return obj.investor_id == request.user.id or obj.project.entrepreneur_id == request.user.id
        return obj.investor_id == request.user.id
