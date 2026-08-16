from rest_framework.permissions import SAFE_METHODS, BasePermission


class InvestmentPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(view, "action", None) == "create":
            return request.user.user_type == "investor" and not request.user.is_staff
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return obj.investor_id == request.user.id or obj.project.entrepreneur_id == request.user.id
        return obj.investor_id == request.user.id


class MilestonePermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.project.entrepreneur_id == request.user.id


class RepaymentPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user.is_staff
            or obj.investment.investor_id == request.user.id
            or obj.investment.project.entrepreneur_id == request.user.id
        )
