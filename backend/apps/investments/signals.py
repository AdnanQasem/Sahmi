from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Investment
from .services import publish_investment_confirmed_event, sync_project_totals


@receiver(pre_save, sender=Investment)
def remember_previous_investment_state(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_project_id = None
        instance._previous_status = None
        return

    previous = sender.objects.filter(pk=instance.pk).values("project_id", "status").first()
    instance._previous_project_id = previous["project_id"] if previous else None
    instance._previous_status = previous["status"] if previous else None


@receiver(post_save, sender=Investment)
def sync_and_publish_investment_update(sender, instance, created, **kwargs):
    previous_project_id = getattr(instance, "_previous_project_id", None)
    previous_status = getattr(instance, "_previous_status", None)

    project_ids = {instance.project_id}
    if previous_project_id and previous_project_id != instance.project_id:
        project_ids.add(previous_project_id)

    became_confirmed = instance.status == Investment.Status.CONFIRMED and previous_status != Investment.Status.CONFIRMED
    investment_id = instance.pk

    def after_commit():
        for project_id in project_ids:
            sync_project_totals(project_id)
        if became_confirmed:
            publish_investment_confirmed_event(investment_id)

    transaction.on_commit(after_commit)


@receiver(post_delete, sender=Investment)
def sync_project_after_investment_delete(sender, instance, **kwargs):
    project_id = instance.project_id
    transaction.on_commit(lambda: sync_project_totals(project_id))
