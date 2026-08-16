from decimal import Decimal

from django.db import transaction
from django.db.models import Prefetch, Sum
from django.utils import timezone
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit

from .models import (
    Investment,
    Milestone,
    ProjectFundingAccount,
    Repayment,
    RepaymentTransfer,
    WithdrawalRequest,
)
from .payments import get_payment_provider
from .permissions import InvestmentPermission, MilestonePermission, RepaymentPermission
from .serializers import (
    InvestmentSerializer,
    MilestoneSerializer,
    RepaymentSerializer,
    RepaymentTransferSerializer,
    WithdrawalRequestSerializer,
)
from .services import (
    FUNDED_INVESTMENT_STATUSES,
    expire_pending_investments,
    start_project_quality_hold,
    refresh_open_repayment_statuses,
    sync_repayment_totals,
    sync_project_totals,
)
from apps.projects.models import Project


class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [InvestmentPermission]
    filterset_fields = ["project", "status", "payment_method"]
    ordering_fields = ["investment_date", "amount", "status"]
    queryset = Investment.objects.none()

    def get_queryset(self):
        user = self.request.user
        queryset = Investment.objects.select_related(
            "investor", "project", "project__entrepreneur"
        )
        if not user.is_authenticated:
            return queryset.none()
        if user.is_staff:
            return queryset
        # Investors see their own; entrepreneurs see those for their projects.
        # Field-level scope is enforced inside the serializer representation later
        # — here we only leak the existence of investments, not extra PII.
        return (queryset.filter(investor=user)
                | queryset.filter(project__entrepreneur=user)).distinct()

    def perform_create(self, serializer):
        with transaction.atomic():
            project = Project.objects.select_for_update().get(
                pk=serializer.validated_data["project"].pk
            )
            if not project.is_verified or project.status != Project.Status.ACTIVE:
                raise ValidationError(
                    {"project": "Project is not currently accepting investments."}
                )
            expire_pending_investments(project)
            reserved = (
                Investment.objects.filter(
                    project=project,
                    status__in=[Investment.Status.PENDING, Investment.Status.CONFIRMED],
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )
            amount = serializer.validated_data["amount"]
            remaining = project.goal_amount - reserved
            if amount > remaining:
                raise ValidationError(
                    {"amount": f"Exceeding value. Remaining funding is {max(remaining, 0)}."}
                )
            investment = serializer.save(investor=self.request.user, project=project)
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit

        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_CREATED,
            title="Investment recorded",
            body=f"Your investment record of {investment.amount} has been created (pending).",
            actor=self.request.user,
            target_type="investment",
            target_id=str(investment.id),
        )
        # Notify the project owner too.
        owner = investment.project.entrepreneur
        if owner and owner.pk != investment.investor_id:
            notify_on_commit(
                recipient=owner,
                notification_type=Notification.NotificationType.INVESTMENT_CREATED,
                title="New investment received",
                body=f"A new investment record ({investment.amount}) is pending on your project “{investment.project.title}”.",
                actor=investment.investor,
                target_type="investment",
                target_id=str(investment.id),
            )

    def perform_update(self, serializer):
        with transaction.atomic():
            locked = Investment.objects.select_for_update().select_related("project").get(pk=serializer.instance.pk)
            old_project_id = locked.project_id
            new_project = serializer.validated_data.get("project", locked.project)
            if not self.request.user.is_staff:
                if locked.status != Investment.Status.PENDING:
                    raise PermissionDenied("Only pending investments can be edited.")
                if new_project.pk != old_project_id:
                    raise PermissionDenied("Project reassignment is administrator-controlled.")
            if locked.status == Investment.Status.PENDING:
                project = Project.objects.select_for_update().get(pk=new_project.pk)
                requested_amount = serializer.validated_data.get("amount", locked.amount)
                reserved = Investment.objects.filter(
                    project=project,
                    status__in=[Investment.Status.PENDING, Investment.Status.CONFIRMED],
                ).exclude(pk=locked.pk).aggregate(total=Sum("amount"))["total"] or 0
                if requested_amount > project.goal_amount - reserved:
                    raise ValidationError({"amount": f"Exceeding value. Remaining funding is {max(project.goal_amount - reserved, 0)}."})
            serializer.instance = locked
            investment = serializer.save()
            sync_project_totals(old_project_id)
            if investment.project_id != old_project_id:
                sync_project_totals(investment.project_id)

    def perform_destroy(self, instance):
        project_id = instance.project_id
        with transaction.atomic():
            instance.delete()
            sync_project_totals(project_id)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path="cancel",
    )
    def cancel(self, request, pk=None):
        """An investor may withdraw their own pending investment."""
        investment = self.get_object()
        if investment.investor_id != request.user.id and not request.user.is_staff:
            raise PermissionDenied("You can only cancel your own investments.")
        if investment.status != Investment.Status.PENDING:
            raise ValidationError("Only pending investments can be cancelled.")
        with transaction.atomic():
            investment.status = Investment.Status.CANCELED
            investment.save(update_fields=["status", "updated_at"])
            sync_project_totals(investment.project_id)
            from apps.audit.services import log as audit_log
            audit_log(
                action="investment.status_changed", actor=request.user, target_type="investment",
                target_id=str(investment.id), metadata={"before": Investment.Status.PENDING, "after": investment.status},
                request=request,
            )
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit

        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title="Investment cancelled",
            body="Your investment has been cancelled.",
            actor=request.user,
            target_type="investment",
            target_id=str(investment.id),
        )
        return Response(InvestmentSerializer(investment).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdminUser],
        url_path="confirm",
    )
    def confirm(self, request, pk=None):
        """Only an authorized staff member may confirm an investment."""
        with transaction.atomic():
            investment = Investment.objects.select_for_update().select_related(
                "project", "project__entrepreneur", "investor"
            ).get(pk=self.get_object().pk)
            project = Project.objects.select_for_update().get(pk=investment.project_id)
            if investment.status == Investment.Status.CONFIRMED:
                return Response(InvestmentSerializer(investment).data)
            if investment.status != Investment.Status.PENDING:
                raise ValidationError(
                    "Only pending investments can be confirmed by an administrator."
                )
            if project.status != Project.Status.ACTIVE:
                raise ValidationError("This project is no longer accepting investment confirmations.")
            if investment.pending_expires_at and investment.pending_expires_at <= timezone.now():
                investment.status = Investment.Status.FAILED
                investment.save(update_fields=["status", "updated_at"])
                from apps.audit.services import log as audit_log
                audit_log(
                    action="investment.status_changed", actor=request.user, target_type="investment",
                    target_id=str(investment.id),
                    metadata={"before": Investment.Status.PENDING, "after": investment.status, "reason": "pending_expired"},
                    request=request,
                )
                return Response(
                    {"detail": "This pending investment has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            confirmed_total = (
                Investment.objects.filter(
                    project=project,
                    status__in=FUNDED_INVESTMENT_STATUSES,
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )
            if confirmed_total + investment.amount > project.goal_amount:
                remaining = max(project.goal_amount - confirmed_total, 0)
                raise ValidationError(
                    {"amount": f"Exceeding value. Remaining funding is {remaining}."}
                )
            investment.status = Investment.Status.CONFIRMED
            investment.save(update_fields=["status", "updated_at"])
            sync_project_totals(investment.project_id)
            from apps.audit.services import log as audit_log
            audit_log(
                action="investment.status_changed", actor=request.user, target_type="investment",
                target_id=str(investment.id), metadata={"before": Investment.Status.PENDING, "after": investment.status},
                request=request,
            )
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit

        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title="Investment confirmed",
            body=f"An investment of {investment.amount} on your project {investment.project.title} has been confirmed.",
            actor=request.user,
            target_type="investment",
            target_id=str(investment.id),
        )
        owner = investment.project.entrepreneur
        if owner and owner.pk != investment.investor_id:
            notify_on_commit(
                recipient=owner,
                notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
                title="Investment confirmed",
                body=f"An investment of {investment.amount} on your project {investment.project.title} has been confirmed.",
                actor=request.user,
                target_type="investment",
                target_id=str(investment.id),
            )
        return Response(InvestmentSerializer(investment).data)


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
        if self.request.user.is_staff and not self.request.user.is_superuser:
            raise PermissionDenied("Application administrators cannot create milestones.")
        self._ensure_project_access(serializer.validated_data['project'])
        serializer.save()

    def perform_update(self, serializer):
        project = serializer.validated_data.get('project', serializer.instance.project)
        self._ensure_project_access(project)
        original_status = serializer.instance.status if serializer.instance else None
        milestone = serializer.save()
        if original_status != milestone.status:
            from apps.notifications.models import Notification
            from apps.notifications.services import notify_on_commit

            notify_on_commit(
                recipient=milestone.project.entrepreneur,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone updated",
                body=f"Milestone “{milestone.title}” was updated.",
                actor=self.request.user,
                target_type="milestone",
                target_id=str(milestone.id),
            )

    @staticmethod
    def _validate_completion_evidence(file):
        if file.size > 10 * 1024 * 1024:
            raise ValidationError({"completion_evidence": "Completion evidence may not exceed 10 MB."})
        extension = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
        if extension not in {"pdf", "png", "jpg", "jpeg", "webp"}:
            raise ValidationError({"completion_evidence": "Completion evidence must be a PDF or image file."})

    @action(detail=True, methods=["post"], url_path="submit-completion")
    @transaction.atomic
    def submit_completion(self, request, pk=None):
        milestone = Milestone.objects.select_for_update().select_related(
            "project", "project__entrepreneur"
        ).get(pk=self.get_object().pk)
        project = Project.objects.select_for_update().get(pk=milestone.project_id)
        if project.entrepreneur_id != request.user.id:
            raise PermissionDenied("Only the project entrepreneur can submit milestone completion evidence.")
        if project.status != Project.Status.IMPLEMENTATION:
            raise ValidationError({"project": "Milestone completion can only be submitted during implementation."})
        if milestone.status not in {Milestone.Status.IN_PROGRESS, Milestone.Status.DELAYED}:
            raise ValidationError({"milestone": "Only the current in-progress milestone can be submitted for completion."})
        if milestone.completion_status in {
            Milestone.CompletionStatus.SUBMITTED,
            Milestone.CompletionStatus.UNDER_REVIEW,
            Milestone.CompletionStatus.APPROVED,
        }:
            raise ValidationError({"completion_status": "This milestone already has an active completion review."})
        if project.milestones.filter(order__lt=milestone.order).exclude(
            status=Milestone.Status.COMPLETED
        ).exists():
            raise ValidationError({"milestone": "Complete the previous milestone first."})
        allocation = (
            project.funded_amount * milestone.percentage_of_project / 100
        ).quantize(Decimal("0.01"))
        if milestone.funding_released < allocation:
            raise ValidationError({
                "milestone": f"The full milestone allocation ({allocation}) must be released before completion can be submitted."
            })
        summary = str(request.data.get("completion_summary", "")).strip()
        if len(summary) < 10:
            raise ValidationError({"completion_summary": "Describe the completed work in at least 10 characters."})
        evidence = request.FILES.get("completion_evidence")
        if evidence:
            self._validate_completion_evidence(evidence)
        elif not milestone.completion_evidence:
            raise ValidationError({"completion_evidence": "Upload final milestone evidence or an invoice."})
        before = milestone.completion_status
        milestone.completion_summary = summary
        if evidence:
            milestone.completion_evidence = evidence
        milestone.completion_status = Milestone.CompletionStatus.SUBMITTED
        milestone.completion_submitted_at = timezone.now()
        milestone.completion_review_notes = ""
        milestone.completion_reviewed_by = None
        milestone.completion_reviewed_at = None
        milestone.save(update_fields=[
            "completion_summary", "completion_evidence", "completion_status",
            "completion_submitted_at", "completion_review_notes",
            "completion_reviewed_by", "completion_reviewed_at", "updated_at",
        ])
        from apps.audit.services import log as audit_log
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit
        audit_log(
            action="milestone.completion_submitted",
            actor=request.user,
            target_type="milestone",
            target_id=str(milestone.id),
            metadata={"before": before, "after": milestone.completion_status, "project_id": str(project.id)},
            request=request,
        )
        for admin in type(request.user).objects.filter(is_staff=True, is_active=True):
            notify_on_commit(
                recipient=admin,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone completion submitted",
                body=f"Completion evidence for “{milestone.title}” on “{project.title}” is ready for review.",
                actor=request.user,
                target_type="milestone",
                target_id=str(milestone.id),
            )
        return Response(self.get_serializer(milestone).data)

    def _completion_review_transition(self, request, milestone, next_status, allowed, *, require_notes=False):
        with transaction.atomic():
            milestone = Milestone.objects.select_for_update().select_related(
                "project", "project__entrepreneur"
            ).get(pk=milestone.pk)
            if milestone.completion_status not in allowed:
                raise ValidationError({
                    "completion_status": f"A {milestone.completion_status} submission cannot become {next_status}."
                })
            notes = str(request.data.get("review_notes", "")).strip()
            if require_notes and not notes:
                raise ValidationError({"review_notes": "Review notes are required."})
            before = milestone.completion_status
            milestone.completion_status = next_status
            milestone.completion_review_notes = notes
            milestone.completion_reviewed_by = request.user
            milestone.completion_reviewed_at = timezone.now()
            milestone.save(update_fields=[
                "completion_status", "completion_review_notes", "completion_reviewed_by",
                "completion_reviewed_at", "updated_at",
            ])
            from apps.audit.services import log as audit_log
            from apps.notifications.models import Notification
            from apps.notifications.services import notify_on_commit
            audit_log(
                action=f"milestone.completion_{next_status}",
                actor=request.user,
                target_type="milestone",
                target_id=str(milestone.id),
                metadata={"before": before, "after": next_status, "project_id": str(milestone.project_id)},
                request=request,
            )
            notify_on_commit(
                recipient=milestone.project.entrepreneur,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone completion updated",
                body=f"Your completion submission for “{milestone.title}” is now {milestone.get_completion_status_display().lower()}.",
                actor=request.user,
                target_type="milestone",
                target_id=str(milestone.id),
            )
        return milestone

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser], url_path="review-completion")
    def review_completion(self, request, pk=None):
        milestone = self._completion_review_transition(
            request, self.get_object(), Milestone.CompletionStatus.UNDER_REVIEW,
            {Milestone.CompletionStatus.SUBMITTED},
        )
        return Response(self.get_serializer(milestone).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser], url_path="request-completion-revision")
    def request_completion_revision(self, request, pk=None):
        milestone = self._completion_review_transition(
            request, self.get_object(), Milestone.CompletionStatus.REVISION_REQUIRED,
            {Milestone.CompletionStatus.UNDER_REVIEW}, require_notes=True,
        )
        return Response(self.get_serializer(milestone).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser], url_path="reject-completion")
    def reject_completion(self, request, pk=None):
        milestone = self._completion_review_transition(
            request, self.get_object(), Milestone.CompletionStatus.REJECTED,
            {Milestone.CompletionStatus.UNDER_REVIEW}, require_notes=True,
        )
        return Response(self.get_serializer(milestone).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser], url_path="approve-completion")
    @transaction.atomic
    def approve_completion(self, request, pk=None):
        milestone = Milestone.objects.select_for_update().select_related(
            "project", "project__entrepreneur"
        ).get(pk=self.get_object().pk)
        if milestone.completion_status != Milestone.CompletionStatus.UNDER_REVIEW:
            raise ValidationError({"completion_status": "Only a completion under review can be approved."})
        project = Project.objects.select_for_update().get(pk=milestone.project_id)
        allocation = (
            project.funded_amount * milestone.percentage_of_project / 100
        ).quantize(Decimal("0.01"))
        if milestone.funding_released < allocation:
            raise ValidationError({"milestone": "The milestone allocation has not been fully released."})
        if project.milestones.filter(order__lt=milestone.order).exclude(
            status=Milestone.Status.COMPLETED
        ).exists():
            raise ValidationError({"milestone": "Earlier milestones must be completed first."})
        now = timezone.now()
        milestone.completion_status = Milestone.CompletionStatus.APPROVED
        milestone.completion_review_notes = str(request.data.get("review_notes", "")).strip()
        milestone.completion_reviewed_by = request.user
        milestone.completion_reviewed_at = now
        milestone.status = Milestone.Status.COMPLETED
        milestone.actual_completion_date = timezone.localdate()
        milestone.save(update_fields=[
            "completion_status", "completion_review_notes", "completion_reviewed_by",
            "completion_reviewed_at", "status", "actual_completion_date", "updated_at",
        ])
        from apps.audit.services import log as audit_log
        next_milestone = project.milestones.select_for_update().filter(
            order__gt=milestone.order,
            status=Milestone.Status.PENDING,
        ).order_by("order").first()
        if next_milestone:
            next_milestone.status = Milestone.Status.IN_PROGRESS
            next_milestone.save(update_fields=["status", "updated_at"])
            audit_log(
                action="milestone.status_changed",
                actor=request.user,
                target_type="milestone",
                target_id=str(next_milestone.id),
                metadata={"before": Milestone.Status.PENDING, "after": Milestone.Status.IN_PROGRESS, "reason": "previous_milestone_completed"},
                request=request,
            )
        quality_hold_started = start_project_quality_hold(project, request.user, request=request)
        audit_log(
            action="milestone.completion_approved",
            actor=request.user,
            target_type="milestone",
            target_id=str(milestone.id),
            metadata={
                "project_id": str(project.id),
                "project_completed": False,
                "quality_hold_started": quality_hold_started,
            },
            request=request,
        )
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit
        recipients = {project.entrepreneur_id: project.entrepreneur}
        for investment in project.investments.filter(status__in=FUNDED_INVESTMENT_STATUSES).select_related("investor"):
            recipients[investment.investor_id] = investment.investor
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone completed",
                body=f"Milestone “{milestone.title}” for “{project.title}” was verified and completed.",
                actor=request.user,
                target_type="milestone",
                target_id=str(milestone.id),
            )
        return Response(self.get_serializer(milestone).data)


class RepaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Repayment.objects.select_related(
        "investment", "investment__investor", "investment__project", "funding_transfer"
    )
    serializer_class = RepaymentSerializer
    permission_classes = [RepaymentPermission]
    filterset_fields = ["investment", "status", "scheduled_date"]
    ordering_fields = ["scheduled_date", "amount", "status"]

    def get_queryset(self):
        refresh_open_repayment_statuses()
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        if user.user_type == "investor":
            return queryset.filter(investment__investor=user)
        if user.user_type == "entrepreneur":
            return queryset.filter(investment__project__entrepreneur=user)
        return queryset.none()

    @action(detail=False, methods=["get"])
    def summary(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        active = queryset.exclude(status=Repayment.Status.CANCELLED)
        investments = Investment.objects.filter(
            status=Investment.Status.COMPLETED,
            project__status=Project.Status.CLOSED,
        ).select_related("investor", "project").prefetch_related(
            Prefetch(
                "repayments",
                queryset=Repayment.objects.exclude(status=Repayment.Status.CANCELLED).order_by("scheduled_date"),
                to_attr="active_repayments",
            )
        )
        if not request.user.is_staff:
            if request.user.user_type == "investor":
                investments = investments.filter(investor=request.user)
            elif request.user.user_type == "entrepreneur":
                investments = investments.filter(project__entrepreneur=request.user)
            else:
                investments = investments.none()
        obligation_parts = investments.aggregate(
            principal=Sum("amount"),
            expected_return=Sum("expected_return"),
        )
        obligation = (
            (obligation_parts["principal"] or Decimal("0.00"))
            + (obligation_parts["expected_return"] or Decimal("0.00"))
        )
        obligations_by_recipient = {}
        for investment in investments.order_by("project__title", "investor__full_name", "investment_date"):
            key = (investment.project_id, investment.investor_id)
            group = obligations_by_recipient.setdefault(key, {
                "project_id": str(investment.project_id),
                "project_slug": investment.project.slug,
                "project_title": investment.project.title,
                "investor_id": str(investment.investor_id),
                "investor_name": investment.investor.full_name or investment.investor.email,
                "investment_count": 0,
                "invested_total": Decimal("0.00"),
                "expected_return": Decimal("0.00"),
                "expected_repayment_total": Decimal("0.00"),
                "scheduled_total": Decimal("0.00"),
                "actual_return": Decimal("0.00"),
                "remaining_total": Decimal("0.00"),
                "next_repayment_date": None,
                "status": "pending_schedule",
            })
            group["investment_count"] += 1
            group["invested_total"] += investment.amount
            group["expected_return"] += investment.expected_return
            group["expected_repayment_total"] += investment.amount + investment.expected_return
            for repayment in investment.active_repayments:
                group["scheduled_total"] += repayment.amount
                if repayment.status == Repayment.Status.PAID:
                    group["actual_return"] += repayment.amount
                elif (
                    group["next_repayment_date"] is None
                    or repayment.scheduled_date < group["next_repayment_date"]
                ):
                    group["next_repayment_date"] = repayment.scheduled_date

        obligations = []
        for group in obligations_by_recipient.values():
            group["expected_roi_percent"] = (
                (group["expected_return"] / group["invested_total"]) * Decimal("100")
                if group["invested_total"] > 0
                else Decimal("0.00")
            )
            group["remaining_total"] = max(
                group["expected_repayment_total"] - group["actual_return"],
                Decimal("0.00"),
            )
            group_repayments = [
                repayment
                for investment in investments
                if str(investment.project_id) == group["project_id"]
                and str(investment.investor_id) == group["investor_id"]
                for repayment in investment.active_repayments
            ]
            if group["remaining_total"] == 0 and group["expected_repayment_total"] > 0:
                group["status"] = "completed"
            elif any(repayment.status == Repayment.Status.OVERDUE for repayment in group_repayments):
                group["status"] = "overdue"
            elif group["scheduled_total"] > 0:
                group["status"] = "scheduled"
            for field in (
                "invested_total", "expected_return", "expected_repayment_total",
                "scheduled_total", "actual_return", "remaining_total",
                "expected_roi_percent",
            ):
                group[field] = f"{group[field]:.2f}"
            if group["next_repayment_date"]:
                group["next_repayment_date"] = group["next_repayment_date"].isoformat()
            obligations.append(group)
        scheduled = active.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        paid = active.filter(status=Repayment.Status.PAID).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
        return Response({
            "obligation_total": obligation,
            "scheduled_total": scheduled,
            "paid_total": paid,
            "remaining_total": max(obligation - paid, Decimal("0.00")),
            "unscheduled_total": max(obligation - scheduled, Decimal("0.00")),
            "obligations": obligations,
            "next_repayment_date": active.exclude(status=Repayment.Status.PAID)
                .order_by("scheduled_date").values_list("scheduled_date", flat=True).first(),
            "counts": {
                value: queryset.filter(status=value).count()
                for value, _label in Repayment.Status.choices
            },
        })


class RepaymentTransferViewSet(viewsets.ModelViewSet):
    """Manual bank-reconciliation workflow for repayment funding and payout."""

    serializer_class = RepaymentTransferSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ["repayment", "status"]
    ordering_fields = ["created_at", "inbound_transfer_date", "status"]
    queryset = RepaymentTransfer.objects.select_related(
        "repayment",
        "repayment__investment",
        "repayment__investment__investor",
        "repayment__investment__project",
        "submitted_by",
        "reviewed_by",
        "disbursed_by",
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_staff:
            return queryset
        if user.user_type == "entrepreneur":
            return queryset.filter(repayment__investment__project__entrepreneur=user)
        if user.user_type == "investor":
            return queryset.filter(repayment__investment__investor=user)
        return queryset.none()

    def perform_create(self, serializer):
        transfer = serializer.save()
        from apps.audit.services import log as audit_log

        audit_log(
            action="repayment_funding.submitted",
            actor=self.request.user,
            target_type="repayment_transfer",
            target_id=str(transfer.id),
            metadata={
                "repayment_id": str(transfer.repayment_id),
                "amount": str(transfer.amount),
                "currency": transfer.currency,
                "agreement_version": transfer.agreement_version,
            },
            request=self.request,
        )

    def _staff_transfer(self, pk):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only an administrator can reconcile repayment transfers.")
        return self.get_queryset().select_for_update().get(pk=pk)

    def _audit_transition(self, transfer, action_name, before):
        from apps.audit.services import log as audit_log

        audit_log(
            action=action_name,
            actor=self.request.user,
            target_type="repayment_transfer",
            target_id=str(transfer.id),
            metadata={"before": before, "after": transfer.status},
            request=self.request,
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def review(self, request, pk=None):
        transfer = self._staff_transfer(pk)
        if transfer.status != RepaymentTransfer.Status.SUBMITTED:
            raise ValidationError({"status": "Only submitted transfers can enter review."})
        before = transfer.status
        transfer.status = RepaymentTransfer.Status.UNDER_REVIEW
        transfer.reviewed_by = request.user
        transfer.reviewed_at = timezone.now()
        transfer.review_notes = str(request.data.get("review_notes", "")).strip()
        transfer.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes", "updated_at"])
        self._audit_transition(transfer, "repayment_funding.review_started", before)
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def verify(self, request, pk=None):
        transfer = self._staff_transfer(pk)
        if transfer.status != RepaymentTransfer.Status.UNDER_REVIEW:
            raise ValidationError({"status": "Review the transfer before verifying it."})
        notes = str(request.data.get("review_notes", "")).strip()
        if len(notes) < 10:
            raise ValidationError({"review_notes": "Record how the bank statement was verified."})
        before = transfer.status
        transfer.status = RepaymentTransfer.Status.VERIFIED
        transfer.reviewed_by = request.user
        transfer.reviewed_at = timezone.now()
        transfer.review_notes = notes
        transfer.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes", "updated_at"])
        self._audit_transition(transfer, "repayment_funding.inbound_verified", before)
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def reject(self, request, pk=None):
        transfer = self._staff_transfer(pk)
        if transfer.status not in {
            RepaymentTransfer.Status.SUBMITTED,
            RepaymentTransfer.Status.UNDER_REVIEW,
        }:
            raise ValidationError({"status": "This transfer can no longer be rejected."})
        notes = str(request.data.get("review_notes", "")).strip()
        if len(notes) < 10:
            raise ValidationError({"review_notes": "Explain why the transfer was rejected."})
        before = transfer.status
        transfer.status = RepaymentTransfer.Status.REJECTED
        transfer.reviewed_by = request.user
        transfer.reviewed_at = timezone.now()
        transfer.review_notes = notes
        transfer.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes", "updated_at"])
        self._audit_transition(transfer, "repayment_funding.rejected", before)
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def disburse(self, request, pk=None):
        transfer = self._staff_transfer(pk)
        if transfer.status != RepaymentTransfer.Status.VERIFIED:
            raise ValidationError({"status": "Verify the inbound transfer before disbursement."})
        repayment = Repayment.objects.select_for_update().get(pk=transfer.repayment_id)
        if repayment.status in {Repayment.Status.PAID, Repayment.Status.CANCELLED}:
            raise ValidationError({"status": "This repayment is already final."})
        outbound_reference = str(request.data.get("outbound_reference", "")).strip()
        if not outbound_reference:
            raise ValidationError({"outbound_reference": "The bank payout reference is required."})
        if RepaymentTransfer.objects.exclude(pk=transfer.pk).filter(
            outbound_reference=outbound_reference
        ).exists() or Repayment.objects.exclude(pk=repayment.pk).filter(
            transaction_id=outbound_reference
        ).exists():
            raise ValidationError({"outbound_reference": "This payout reference is already recorded."})
        paid_date = drf_serializers.DateField().run_validation(
            request.data.get("actual_payment_date") or timezone.localdate()
        )
        if paid_date > timezone.localdate():
            raise ValidationError({"actual_payment_date": "The payment date cannot be in the future."})

        before = transfer.status
        transfer.status = RepaymentTransfer.Status.DISBURSED
        transfer.outbound_reference = outbound_reference
        transfer.disbursed_by = request.user
        transfer.disbursed_at = timezone.now()
        transfer.save(update_fields=[
            "status", "outbound_reference", "disbursed_by", "disbursed_at", "updated_at",
        ])
        repayment.status = Repayment.Status.PAID
        repayment.actual_payment_date = paid_date
        repayment.payment_method = Investment.PaymentMethod.BANK_TRANSFER
        repayment.transaction_id = outbound_reference
        repayment.save(update_fields=[
            "status", "actual_payment_date", "payment_method", "transaction_id", "updated_at",
        ])
        sync_repayment_totals(repayment.investment.project_id)
        self._audit_transition(transfer, "repayment_funding.disbursed", before)

        recipients = {
            repayment.investment.investor_id: repayment.investment.investor,
            repayment.investment.project.entrepreneur_id: repayment.investment.project.entrepreneur,
        }
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient,
                notification_type=Notification.NotificationType.REPAYMENT_UPDATED,
                title="Repayment disbursed",
                body=f"The repayment of {repayment.amount} for “{repayment.investment.project.title}” was reconciled and paid.",
                actor=request.user,
                target_type="repayment",
                target_id=str(repayment.id),
            )
        return Response(self.get_serializer(transfer).data)


class WithdrawalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project", "milestone", "status"]
    ordering_fields = ["created_at", "amount", "status"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = WithdrawalRequest.objects.select_related(
            "project", "project__entrepreneur", "milestone", "requested_by", "reviewed_by", "released_by"
        )
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(project__entrepreneur=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.is_staff and not self.request.user.is_superuser:
            raise PermissionDenied(
                "Application administrators cannot create withdrawal requests."
            )
        with transaction.atomic():
            milestone = Milestone.objects.select_for_update().select_related("project").get(
                pk=serializer.validated_data["milestone"].pk
            )
            project = Project.objects.select_for_update().get(pk=milestone.project_id)
            if project.status != Project.Status.IMPLEMENTATION:
                raise ValidationError({"project": "This project is not in implementation."})
            if WithdrawalRequest.objects.filter(
                milestone=milestone,
                status__in=[WithdrawalRequest.Status.REQUESTED, WithdrawalRequest.Status.UNDER_REVIEW, WithdrawalRequest.Status.APPROVED],
            ).exists():
                raise ValidationError({"milestone": "This milestone already has an open withdrawal request."})
            earlier = project.milestones.select_for_update().filter(order__lt=milestone.order)
            if earlier.exclude(status=Milestone.Status.COMPLETED).exists():
                raise ValidationError({"milestone": "Complete earlier milestones before requesting this release."})
            account = ProjectFundingAccount.objects.select_for_update().filter(project=project).first()
            available = account.available if account else 0
            amount = serializer.validated_data["amount"]
            allocation = (
                project.funded_amount * milestone.percentage_of_project / 100
            ).quantize(Decimal("0.01"))
            released_for_milestone = WithdrawalRequest.objects.filter(
                milestone=milestone,
                status=WithdrawalRequest.Status.RELEASED,
            ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
            if amount + released_for_milestone > allocation:
                raise ValidationError({"amount": "This request exceeds the milestone allocation."})
            if amount > available:
                raise ValidationError({"amount": f"Only {available} remains available."})
            serializer.validated_data["milestone"] = milestone
            withdrawal = serializer.save(project=project, requested_by=self.request.user)
            from apps.audit.services import log as audit_log
            from apps.notifications.models import Notification
            from apps.notifications.services import notify_on_commit
            audit_log(
                action="withdrawal.requested", actor=self.request.user, target_type="withdrawal",
                target_id=str(withdrawal.id), metadata={"project_id": str(project.id), "amount": str(withdrawal.amount)},
                request=self.request,
            )
            for admin in type(self.request.user).objects.filter(is_staff=True, is_active=True):
                notify_on_commit(
                    recipient=admin,
                    notification_type=Notification.NotificationType.WITHDRAWAL_UPDATED,
                    title="Fund release requested",
                    body=f"{project.entrepreneur} requested {withdrawal.amount} for “{milestone.title}” on “{project.title}”.",
                    actor=self.request.user,
                    target_type="withdrawal",
                    target_id=str(withdrawal.id),
                )

    @transaction.atomic
    def _admin_transition(self, request, withdrawal, next_status, allowed, *, require_notes=False):
        with transaction.atomic():
            withdrawal = WithdrawalRequest.objects.select_for_update().select_related(
                "project", "project__entrepreneur", "milestone"
            ).get(pk=withdrawal.pk)
            if withdrawal.status not in allowed:
                raise ValidationError({"status": f"A {withdrawal.status} request cannot become {next_status}."})
            notes = str(request.data.get("review_notes", "")).strip()
            if require_notes and not notes:
                raise ValidationError({"review_notes": "Review notes are required."})
            withdrawal.status = next_status
            withdrawal.review_notes = notes
            withdrawal.reviewed_by = request.user
            withdrawal.reviewed_at = timezone.now()
            withdrawal.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_at", "updated_at"])
        from apps.audit.services import log as audit_log
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit
        audit_log(
            action=f"withdrawal.{next_status}", actor=request.user, target_type="withdrawal",
            target_id=str(withdrawal.id), metadata={"project_id": str(withdrawal.project_id), "amount": str(withdrawal.amount)},
            request=request,
        )
        notify_on_commit(
            recipient=withdrawal.project.entrepreneur,
            notification_type=Notification.NotificationType.WITHDRAWAL_UPDATED,
            title=f"Withdrawal {withdrawal.get_status_display().lower()}",
            body=f"Your {withdrawal.amount} withdrawal request for “{withdrawal.milestone.title}” is {withdrawal.get_status_display().lower()}.",
            actor=request.user, target_type="withdrawal", target_id=str(withdrawal.id),
        )
        return Response(self.get_serializer(withdrawal).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def review(self, request, pk=None):
        return self._admin_transition(request, self.get_object(), WithdrawalRequest.Status.UNDER_REVIEW, {WithdrawalRequest.Status.REQUESTED})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        return self._admin_transition(request, self.get_object(), WithdrawalRequest.Status.APPROVED, {WithdrawalRequest.Status.UNDER_REVIEW})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        return self._admin_transition(request, self.get_object(), WithdrawalRequest.Status.REJECTED, {WithdrawalRequest.Status.UNDER_REVIEW}, require_notes=True)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser], url_path="request-revision")
    def request_revision(self, request, pk=None):
        return self._admin_transition(request, self.get_object(), WithdrawalRequest.Status.REVISION_REQUIRED, {WithdrawalRequest.Status.UNDER_REVIEW}, require_notes=True)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        with transaction.atomic():
            withdrawal = WithdrawalRequest.objects.select_for_update().select_related("project").get(pk=self.get_object().pk)
            if withdrawal.requested_by_id != request.user.id:
                raise PermissionDenied("Only the entrepreneur who requested this withdrawal can cancel it.")
            if withdrawal.status not in {WithdrawalRequest.Status.REQUESTED, WithdrawalRequest.Status.REVISION_REQUIRED}:
                raise ValidationError({"status": "Only requested or revision-required withdrawals can be cancelled."})
            previous = withdrawal.status
            withdrawal.status = WithdrawalRequest.Status.CANCELLED
            withdrawal.save(update_fields=["status", "updated_at"])
            from apps.audit.services import log as audit_log
            audit_log(
                action="withdrawal.cancelled", actor=request.user, target_type="withdrawal",
                target_id=str(withdrawal.id), metadata={"before": previous, "after": withdrawal.status}, request=request,
            )
        return Response(self.get_serializer(withdrawal).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    @transaction.atomic
    def release(self, request, pk=None):
        withdrawal = WithdrawalRequest.objects.select_for_update().select_related(
            "project", "project__entrepreneur", "milestone"
        ).get(pk=self.get_object().pk)
        project = Project.objects.select_for_update().get(pk=withdrawal.project_id)
        milestone = Milestone.objects.select_for_update().get(pk=withdrawal.milestone_id)
        account = ProjectFundingAccount.objects.select_for_update().filter(project=project).first()
        if withdrawal.status != WithdrawalRequest.Status.APPROVED:
            raise ValidationError({"status": "Only approved withdrawals can be released."})
        if project.status != Project.Status.IMPLEMENTATION:
            raise ValidationError({"project": "Funds can only be released during implementation."})
        if milestone.status == Milestone.Status.COMPLETED:
            raise ValidationError({"milestone": "This milestone is already complete."})
        earlier = project.milestones.select_for_update().filter(order__lt=milestone.order)
        if earlier.exclude(status=Milestone.Status.COMPLETED).exists():
            raise ValidationError({"milestone": "Earlier milestones must be completed first."})
        if account is None or withdrawal.amount > account.available:
            raise ValidationError({"amount": "The available secured balance is insufficient."})
        allocation = (project.funded_amount * milestone.percentage_of_project / 100).quantize(Decimal("0.01"))
        released_for_milestone = WithdrawalRequest.objects.filter(
            milestone=milestone, status=WithdrawalRequest.Status.RELEASED,
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        if released_for_milestone + withdrawal.amount > allocation:
            raise ValidationError({"amount": "This release exceeds the milestone allocation."})
        payout = get_payment_provider().release(
            withdrawal_id=str(withdrawal.id), amount=withdrawal.amount,
            recipient_id=str(project.entrepreneur_id),
            metadata={"project_id": str(project.id), "milestone_id": str(milestone.id)},
        )
        now = timezone.now()
        before = {"secured": str(account.secured), "released": str(account.released), "refunded": str(account.refunded)}
        account.secured -= withdrawal.amount
        account.released += withdrawal.amount
        account.save(update_fields=["secured", "released", "updated_at"])
        withdrawal.status = WithdrawalRequest.Status.RELEASED
        withdrawal.released_by = request.user
        withdrawal.released_at = now
        withdrawal.payout_reference = payout.transaction_id
        withdrawal.save(update_fields=["status", "released_by", "released_at", "payout_reference", "updated_at"])
        milestone.funding_released = WithdrawalRequest.objects.filter(
            milestone=milestone, status=WithdrawalRequest.Status.RELEASED,
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        milestone.save(update_fields=["funding_released", "updated_at"])
        from apps.audit.services import log as audit_log
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit
        audit_log(
            action="withdrawal.released", actor=request.user, target_type="withdrawal", target_id=str(withdrawal.id),
            metadata={
                "project_id": str(project.id), "amount": str(withdrawal.amount),
                "balances_before": before,
                "balances_after": {"secured": str(account.secured), "released": str(account.released), "refunded": str(account.refunded), "available": str(account.available)},
                "provider_transaction_id": payout.transaction_id,
            }, request=request,
        )
        recipients = {project.entrepreneur_id: project.entrepreneur}
        for investment in project.investments.filter(status__in=FUNDED_INVESTMENT_STATUSES).select_related("investor"):
            recipients[investment.investor_id] = investment.investor
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient, notification_type=Notification.NotificationType.FUNDS_RELEASED,
                title="Milestone funds released",
                body=f"{withdrawal.amount} was released for “{project.title}” milestone “{milestone.title}”.",
                actor=request.user, target_type="withdrawal", target_id=str(withdrawal.id),
            )
        return Response(self.get_serializer(withdrawal).data)
