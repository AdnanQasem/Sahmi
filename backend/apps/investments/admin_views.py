from calendar import monthrange
from decimal import Decimal

from rest_framework import permissions, serializers, status, viewsets
from django.utils import timezone
from django.db import IntegrityError, transaction
from django.db.models import Count, Q, Sum
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.admin_mixins import ApplicationAdminCreateGuardMixin

from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit
from apps.projects.models import Project

from .admin_serializers import (
    AdminInvestmentSerializer,
    AdminMilestoneSerializer,
    AdminRepaymentPlanSerializer,
    AdminRepaymentSerializer,
    validate_repayment_eligibility,
)
from .models import Investment, Milestone, ProjectFundingAccount, Repayment
from .services import (
    FUNDED_INVESTMENT_STATUSES,
    refresh_open_repayment_statuses,
    repayment_status_for_date,
    sync_repayment_totals,
)


class AdminInvestmentViewSet(ApplicationAdminCreateGuardMixin, viewsets.ModelViewSet):
    queryset = Investment.objects.select_related(
        "investor", "project", "project__entrepreneur"
    )
    serializer_class = AdminInvestmentSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "investor": ["exact"],
        "project": ["exact"],
        "status": ["exact"],
        "payment_method": ["exact"],
        "investment_date": ["date", "gte", "lte"],
        "return_received_at": ["date", "gte", "lte", "isnull"],
    }
    search_fields = [
        "transaction_id", "notes", "investor__email", "investor__full_name",
        "project__title", "project__slug",
    ]
    ordering_fields = [
        "investment_date", "created_at", "updated_at", "amount", "quantity",
        "status", "expected_return", "actual_return", "return_received_at",
    ]
    ordering = ["-investment_date"]
    creation_denied_message = "Application administrators cannot create investments."

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Return filtered ledger totals independently of result pagination."""
        queryset = self.filter_queryset(self.get_queryset())
        totals = queryset.aggregate(
            recorded_total=Sum("amount"),
            funded_total=Sum(
                "amount",
                filter=Q(status__in=FUNDED_INVESTMENT_STATUSES),
            ),
            total_count=Count("id"),
            funded_count=Count(
                "id",
                filter=Q(status__in=FUNDED_INVESTMENT_STATUSES),
            ),
            pending_count=Count(
                "id",
                filter=Q(status=Investment.Status.PENDING),
            ),
        )
        return Response({
            "recorded_total": f"{totals['recorded_total'] or Decimal('0.00'):.2f}",
            "funded_total": f"{totals['funded_total'] or Decimal('0.00'):.2f}",
            "total_count": totals["total_count"],
            "funded_count": totals["funded_count"],
            "pending_count": totals["pending_count"],
        })

    def perform_update(self, serializer):
        with transaction.atomic():
            locked = Investment.objects.select_for_update().select_related("project").get(pk=serializer.instance.pk)
            previous_status = locked.status
            next_status = serializer.validated_data.get("status", previous_status)
            if previous_status == Investment.Status.PENDING and next_status == Investment.Status.CONFIRMED:
                project = Project.objects.select_for_update().get(pk=locked.project_id)
                if project.status != Project.Status.ACTIVE:
                    raise ValidationError({"status": "This project is no longer accepting investment confirmations."})
                funded = Investment.objects.filter(
                    project=project,
                    status__in=FUNDED_INVESTMENT_STATUSES,
                ).exclude(pk=locked.pk).aggregate(total=Sum("amount"))["total"] or 0
                if funded + serializer.validated_data.get("amount", locked.amount) > project.goal_amount:
                    raise ValidationError({"amount": f"Exceeding value. Remaining funding is {max(project.goal_amount - funded, 0)}."})
            serializer.instance = locked
            investment = serializer.save()
        if previous_status == investment.status:
            return

        from apps.audit.services import log as audit_log
        audit_log(
            action="investment.status_changed", actor=self.request.user, target_type="investment",
            target_id=str(investment.id), metadata={"before": previous_status, "after": investment.status},
            request=self.request,
        )

        status_label = investment.get_status_display().lower()
        confirmed = investment.status == Investment.Status.CONFIRMED
        title = "Investment confirmed" if confirmed else f"Investment {status_label}"
        confirmed_body = f"An investment of {investment.amount} on your project {investment.project.title} has been confirmed."
        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title=title,
            body=confirmed_body if confirmed else (
                f"Your investment of {investment.amount} in "
                f"“{investment.project.title}” is now {status_label}."
            ),
            actor=self.request.user,
            target_type="investment",
            target_id=str(investment.id),
        )

        owner = investment.project.entrepreneur
        if owner and owner.pk != investment.investor_id:
            notify_on_commit(
                recipient=owner,
                notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
                title=title,
                body=confirmed_body if confirmed else (
                    f"An investment of {investment.amount} in "
                    f"“{investment.project.title}” is now {status_label}."
                ),
                actor=self.request.user,
                target_type="investment",
                target_id=str(investment.id),
            )


class AdminMilestoneViewSet(ApplicationAdminCreateGuardMixin, viewsets.ModelViewSet):
    queryset = Milestone.objects.select_related("project", "project__entrepreneur")
    serializer_class = AdminMilestoneSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "project": ["exact"],
        "status": ["exact"],
        "target_date": ["exact", "gte", "lte"],
        "actual_completion_date": ["exact", "gte", "lte", "isnull"],
    }
    search_fields = [
        "title", "description", "deliverables", "project__title", "project__slug",
    ]
    ordering_fields = [
        "target_date", "actual_completion_date", "order", "status",
        "percentage_of_project", "funding_released", "created_at", "updated_at",
    ]
    ordering = ["project", "order"]
    creation_denied_message = "Application administrators cannot create milestones."

    @transaction.atomic
    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        milestone = serializer.save()
        if previous_status == milestone.status:
            return
        project = Project.objects.select_for_update().get(pk=milestone.project_id)
        recipients = {project.entrepreneur_id: project.entrepreneur}
        for investment in project.investments.filter(status__in=FUNDED_INVESTMENT_STATUSES).select_related("investor"):
            recipients[investment.investor_id] = investment.investor
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone approved" if milestone.status == Milestone.Status.COMPLETED else "Milestone updated",
                body=f"Milestone “{milestone.title}” for “{project.title}” is now {milestone.get_status_display().lower()}.",
                actor=self.request.user, target_type="milestone", target_id=str(milestone.id),
            )
        if milestone.status == Milestone.Status.COMPLETED:
            all_complete = project.milestones.exclude(status=Milestone.Status.COMPLETED).exists() is False
            if not all_complete:
                next_milestone = project.milestones.select_for_update().filter(
                    order__gt=milestone.order,
                    status=Milestone.Status.PENDING,
                ).order_by("order").first()
                if next_milestone:
                    next_milestone.status = Milestone.Status.IN_PROGRESS
                    next_milestone.save(update_fields=["status", "updated_at"])
                    from apps.audit.services import log as audit_log
                    audit_log(
                        action="milestone.status_changed",
                        actor=self.request.user,
                        target_type="milestone",
                        target_id=str(next_milestone.id),
                        metadata={
                            "before": Milestone.Status.PENDING,
                            "after": Milestone.Status.IN_PROGRESS,
                            "reason": "previous_milestone_completed",
                        },
                        request=self.request,
                    )


class AdminRepaymentViewSet(ApplicationAdminCreateGuardMixin, viewsets.ModelViewSet):
    queryset = Repayment.objects.select_related(
        "investment", "investment__investor", "investment__project",
        "investment__project__entrepreneur", "funding_transfer",
    )
    serializer_class = AdminRepaymentSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "investment": ["exact"],
        "status": ["exact"],
        "payment_method": ["exact"],
        "scheduled_date": ["exact", "gte", "lte"],
        "actual_payment_date": ["exact", "gte", "lte", "isnull"],
    }
    search_fields = [
        "transaction_id", "notes", "investment__investor__email",
        "investment__investor__full_name", "investment__project__title",
        "investment__project__slug",
    ]
    ordering_fields = [
        "scheduled_date", "actual_payment_date", "amount", "status",
        "created_at", "updated_at",
    ]
    ordering = ["scheduled_date"]
    creation_denied_message = "Application administrators cannot create repayment installments."

    def get_queryset(self):
        refresh_open_repayment_statuses()
        return super().get_queryset()

    def _notify_repayment(self, repayment, title):
        recipients = {
            repayment.investment.investor_id: repayment.investment.investor,
            repayment.investment.project.entrepreneur_id: repayment.investment.project.entrepreneur,
        }
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient,
                notification_type=Notification.NotificationType.REPAYMENT_UPDATED,
                title=title,
                body=(
                    f"A repayment of {repayment.amount} for "
                    f"“{repayment.investment.project.title}” is now "
                    f"{repayment.get_status_display().lower()}."
                ),
                actor=self.request.user,
                target_type="repayment",
                target_id=str(repayment.id),
            )

    @action(detail=False, methods=["post"], url_path="create-plan")
    def create_plan(self, request):
        """Create the investment's remaining repayment plan atomically."""
        if not request.user.is_superuser:
            from apps.audit.models import AuditLog
            from apps.audit.services import log as audit_log

            audit_log(
                action="admin.create_denied",
                actor=request.user,
                target_type="repayment_plan",
                result=AuditLog.Result.DENIED,
                metadata={"path": request.path, "method": request.method},
                request=request,
            )
            raise PermissionDenied(
                "Application administrators cannot create repayment plans."
            )
        return self._create_plan(request)

    @transaction.atomic
    def _create_plan(self, request):
        serializer = AdminRepaymentPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        investment = Investment.objects.select_for_update().select_related(
            "project", "project__entrepreneur", "investor"
        ).get(pk=values["investment"].pk)
        validate_repayment_eligibility(investment, values["first_scheduled_date"])

        scheduled_total = investment.repayments.exclude(
            status=Repayment.Status.CANCELLED
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        remaining = investment.amount + investment.expected_return - scheduled_total
        if remaining <= 0:
            raise ValidationError({
                "investment": "This investment's full repayment obligation is already scheduled."
            })

        count = values["installment_count"]
        total_cents = int((remaining * 100).to_integral_value())
        if count > total_cents:
            raise ValidationError({
                "installment_count": "The installment count would create a zero-value repayment."
            })

        def add_months(value, months):
            month_index = value.month - 1 + months
            year = value.year + month_index // 12
            month = month_index % 12 + 1
            return value.replace(
                year=year,
                month=month,
                day=min(value.day, monthrange(year, month)[1]),
            )

        dates = [
            add_months(
                values["first_scheduled_date"],
                index * values["interval_months"],
            )
            for index in range(count)
        ]
        duplicate_dates = set(
            investment.repayments.filter(scheduled_date__in=dates).values_list(
                "scheduled_date", flat=True
            )
        )
        if duplicate_dates:
            raise ValidationError({
                "first_scheduled_date": (
                    "The generated plan overlaps an existing repayment date: "
                    + ", ".join(sorted(value.isoformat() for value in duplicate_dates))
                )
            })

        base_cents, extra_cents = divmod(total_cents, count)
        repayments = Repayment.objects.bulk_create([
            Repayment(
                investment=investment,
                amount=Decimal(base_cents + (1 if index < extra_cents else 0)) / Decimal("100"),
                scheduled_date=scheduled_date,
                status=repayment_status_for_date(scheduled_date),
                payment_method=values["payment_method"],
                notes=str(values.get("notes", "")).strip(),
            )
            for index, scheduled_date in enumerate(dates)
        ])
        sync_repayment_totals(investment.project_id)

        from apps.audit.services import log as audit_log
        audit_log(
            action="repayment.plan_created",
            actor=request.user,
            target_type="investment",
            target_id=str(investment.id),
            metadata={
                "installment_count": count,
                "scheduled_total": str(remaining),
                "first_scheduled_date": dates[0].isoformat(),
                "last_scheduled_date": dates[-1].isoformat(),
            },
            request=request,
        )
        recipients = {
            investment.investor_id: investment.investor,
            investment.project.entrepreneur_id: investment.project.entrepreneur,
        }
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient,
                notification_type=Notification.NotificationType.REPAYMENT_UPDATED,
                title="Repayment plan scheduled",
                body=(
                    f"A {count}-installment repayment plan totaling {remaining} "
                    f"was scheduled for “{investment.project.title}”."
                ),
                actor=request.user,
                target_type="investment",
                target_id=str(investment.id),
            )
        return Response(
            AdminRepaymentSerializer(repayments, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                repayment = serializer.save(
                    status=repayment_status_for_date(serializer.validated_data["scheduled_date"])
                )
        except IntegrityError as exc:
            raise ValidationError({
                "scheduled_date": "A duplicate repayment record is not allowed."
            }) from exc
        sync_repayment_totals(repayment.investment.project_id)
        self._notify_repayment(repayment, "Repayment scheduled")

    @transaction.atomic
    def perform_update(self, serializer):
        locked = self.get_queryset().select_for_update().get(pk=serializer.instance.pk)
        serializer.instance = locked
        scheduled_date = serializer.validated_data.get(
            "scheduled_date", locked.scheduled_date
        )
        try:
            with transaction.atomic():
                repayment = serializer.save(status=repayment_status_for_date(scheduled_date))
        except IntegrityError as exc:
            raise ValidationError({
                "scheduled_date": "A duplicate repayment record is not allowed."
            }) from exc
        sync_repayment_totals(repayment.investment.project_id)
        self._notify_repayment(repayment, "Repayment schedule updated")

    @transaction.atomic
    def perform_destroy(self, instance):
        locked = self.get_queryset().select_for_update().get(pk=instance.pk)
        if locked.status == Repayment.Status.PAID:
            raise ValidationError({
                "status": "Paid repayment history cannot be deleted."
            })
        project_id = locked.investment.project_id
        locked.delete()
        sync_repayment_totals(project_id)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    @transaction.atomic
    def mark_paid(self, request, pk=None):
        if not request.user.is_superuser:
            raise PermissionDenied(
                "Use the verified repayment-transfer workflow to record an investor payout."
            )
        repayment = self.get_queryset().select_for_update().get(pk=pk)
        if repayment.status in {Repayment.Status.PAID, Repayment.Status.CANCELLED}:
            raise ValidationError({
                "status": f"A {repayment.status} repayment is final and cannot be marked paid."
            })
        paid_date = serializers.DateField().run_validation(
            request.data.get("actual_payment_date") or timezone.localdate()
        )
        if paid_date > timezone.localdate():
            raise ValidationError({
                "actual_payment_date": "The payment date cannot be in the future."
            })
        transaction_id = str(request.data.get("transaction_id") or "").strip()
        if transaction_id and Repayment.objects.exclude(pk=repayment.pk).filter(
            transaction_id=transaction_id
        ).exists():
            raise ValidationError({
                "transaction_id": "This transaction reference is already recorded."
            })
        payment_method = request.data.get("payment_method", repayment.payment_method)
        if payment_method not in Investment.PaymentMethod.values:
            raise ValidationError({"payment_method": "Invalid payment method."})
        previous_status = repayment.status
        repayment.status = Repayment.Status.PAID
        repayment.actual_payment_date = paid_date
        repayment.transaction_id = transaction_id
        repayment.payment_method = payment_method
        repayment.notes = str(request.data.get("notes", repayment.notes)).strip()
        try:
            with transaction.atomic():
                repayment.save(update_fields=[
                    "status", "actual_payment_date", "transaction_id", "payment_method",
                    "notes", "updated_at",
                ])
        except IntegrityError as exc:
            raise ValidationError({
                "transaction_id": "This transaction reference is already recorded."
            }) from exc
        sync_repayment_totals(repayment.investment.project_id)
        from apps.audit.services import log as audit_log
        audit_log(
            action="repayment.marked_paid", actor=request.user,
            target_type="repayment", target_id=str(repayment.id),
            metadata={"before": previous_status, "after": repayment.status},
            request=request,
        )
        self._notify_repayment(repayment, "Repayment recorded as paid")
        repayment.refresh_from_db()
        return Response(self.get_serializer(repayment).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def cancel(self, request, pk=None):
        repayment = self.get_queryset().select_for_update().get(pk=pk)
        if repayment.status in {Repayment.Status.PAID, Repayment.Status.CANCELLED}:
            raise ValidationError({
                "status": f"A {repayment.status} repayment is final and cannot be cancelled."
            })
        previous_status = repayment.status
        repayment.status = Repayment.Status.CANCELLED
        repayment.actual_payment_date = None
        repayment.transaction_id = ""
        repayment.notes = str(request.data.get("notes", repayment.notes)).strip()
        repayment.save(update_fields=[
            "status", "actual_payment_date", "transaction_id", "notes", "updated_at",
        ])
        sync_repayment_totals(repayment.investment.project_id)
        from apps.audit.services import log as audit_log
        audit_log(
            action="repayment.cancelled", actor=request.user,
            target_type="repayment", target_id=str(repayment.id),
            metadata={"before": previous_status, "after": repayment.status},
            request=request,
        )
        self._notify_repayment(repayment, "Repayment cancelled")
        repayment.refresh_from_db()
        return Response(self.get_serializer(repayment).data)
