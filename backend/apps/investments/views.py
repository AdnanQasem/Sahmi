from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Investment, Milestone, Repayment
from .permissions import InvestmentPermission, MilestonePermission, RepaymentPermission
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
        serializer.save(investor=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.select_related("project", "project__entrepreneur")
    serializer_class = MilestoneSerializer
    permission_classes = [MilestonePermission]
    filterset_fields = ["project", "status"]
    ordering_fields = ["target_date", "order", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        return queryset.filter(project__entrepreneur=user)

    def _ensure_project_access(self, project):
        if not self.request.user.is_staff and project.entrepreneur_id != self.request.user.id:
            raise PermissionDenied('You can only create milestones for your own projects.')

    def perform_create(self, serializer):
        self._ensure_project_access(serializer.validated_data['project'])
        serializer.save()

    def perform_update(self, serializer):
        project = serializer.validated_data.get('project', serializer.instance.project)
        self._ensure_project_access(project)
        serializer.save()


class RepaymentViewSet(viewsets.ModelViewSet):
    queryset = Repayment.objects.select_related("investment", "investment__investor", "investment__project")
    serializer_class = RepaymentSerializer
    permission_classes = [RepaymentPermission]
    filterset_fields = ["investment", "status", "scheduled_date"]
    ordering_fields = ["scheduled_date", "amount", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        return queryset.filter(investment__investor=user) | queryset.filter(investment__project__entrepreneur=user)

    def _ensure_investment_access(self, investment):
        is_related_party = (
            investment.investor_id == self.request.user.id
            or investment.project.entrepreneur_id == self.request.user.id
        )
        if not self.request.user.is_staff and not is_related_party:
            raise PermissionDenied(
                'You can only create repayments for investments you are involved in.'
            )

    def perform_create(self, serializer):
        self._ensure_investment_access(serializer.validated_data['investment'])
        serializer.save()

    def perform_update(self, serializer):
        investment = serializer.validated_data.get(
            'investment',
            serializer.instance.investment,
        )
        self._ensure_investment_access(investment)
        serializer.save()
