from rest_framework.exceptions import APIException
from django.db import transaction


class ProjectInvestmentsNotRefunded(APIException):
    status_code = 409
    default_code = "project_investments_not_refunded"
    default_detail = (
        "This project cannot be deleted until all of its investments have been refunded."
    )


def ensure_project_investments_refunded(project):
    """Reject deletion while any investment is not explicitly refunded."""
    if project.investments.exclude(status="refunded").exists():
        raise ProjectInvestmentsNotRefunded()


@transaction.atomic
def hard_delete_project(project):
    """Permanently delete a project and protected project-owned finance rows."""
    from apps.audit.models import AuditLog
    from apps.investments.models import (
        Investment,
        Milestone,
        ProjectFundingAccount,
        Repayment,
        RepaymentPlan,
        RepaymentTransfer,
        WithdrawalRequest,
    )
    from apps.messaging.models import Conversation, Message
    from apps.notifications.models import Notification
    from apps.projects.models import ProjectDocument, ProjectEditRequest, ProjectImage

    investments = Investment.objects.filter(project=project)
    repayments = Repayment.objects.filter(investment__in=investments)
    transfers = RepaymentTransfer.objects.filter(repayment__in=repayments)
    conversations = Conversation.objects.filter(project=project)
    related_querysets = (
        ProjectImage.objects.filter(project=project),
        ProjectDocument.objects.filter(project=project),
        ProjectEditRequest.objects.filter(project=project),
        investments,
        ProjectFundingAccount.objects.filter(project=project),
        repayments,
        transfers,
        RepaymentPlan.objects.filter(project=project),
        Milestone.objects.filter(project=project),
        WithdrawalRequest.objects.filter(project=project),
        conversations,
        Message.objects.filter(conversation__in=conversations),
    )
    target_ids = {str(project.pk)}
    for queryset in related_querysets:
        target_ids.update(str(value) for value in queryset.values_list("pk", flat=True))

    AuditLog.objects.filter(target_id__in=target_ids).delete()
    Notification.objects.filter(target_id__in=target_ids).delete()
    transfers.delete()
    WithdrawalRequest.objects.filter(project=project).delete()
    project.delete()
