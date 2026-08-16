from celery import shared_task

from .services import refresh_open_repayment_statuses, sync_scheduled_implementation


@shared_task
def sync_scheduled_implementation_task():
    """Run the date-based implementation timeline catch-up."""
    return sync_scheduled_implementation()


@shared_task
def refresh_open_repayment_statuses_task():
    return refresh_open_repayment_statuses()
