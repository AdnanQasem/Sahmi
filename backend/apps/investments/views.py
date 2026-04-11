from django.db.models import Sum
from rest_framework import permissions, viewsets

from apps.projects.models import Project

from .models import Investment, Milestone, Repayment
from .permissions import InvestmentPermission
from .serializers import InvestmentSerializer, MilestoneSerializer, RepaymentSerializer


class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [InvestmentPermission]
    filterset_fields = ["project", "status", "payment_method"]
    ordering_fields = ["investment_date", "amount", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = Investment.objects.select_related("investor", "project", "project__entrepreneur")
        if user.is_staff:
            return queryset
        return queryset.filter(investor=user) | queryset.filter(project__entrepreneur=user)

    def perform_create(self, serializer):
        investment = serializer.save(investor=self.request.user)
        if investment.status == Investment.Status.CONFIRMED:
            self._sync_project_totals(investment.project)

    def perform_update(self, serializer):
        investment = serializer.save()
        self._sync_project_totals(investment.project)

    @staticmethod
    def _sync_project_totals(project):
        confirmed = project.investments.filter(status=Investment.Status.CONFIRMED)
        total = confirmed.aggregate(total=Sum("amount"))["total"] or 0
        count = confirmed.values("investor_id").distinct().count()
        Project.objects.filter(pk=project.pk).update(funded_amount=total, investor_count=count)


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.select_related("project", "project__entrepreneur")
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["project", "status"]
    ordering_fields = ["target_date", "order", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        return queryset.filter(project__entrepreneur=user)


class RepaymentViewSet(viewsets.ModelViewSet):
    queryset = Repayment.objects.select_related("investment", "investment__investor", "investment__project")
    serializer_class = RepaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["investment", "status", "scheduled_date"]
    ordering_fields = ["scheduled_date", "amount", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        return queryset.filter(investment__investor=user) | queryset.filter(investment__project__entrepreneur=user)
