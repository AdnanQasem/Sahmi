from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Investment, Milestone, Repayment
from .services import (
    publish_investment_confirmed_event,
    sync_project_totals,
    sync_repayment_totals,
)


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


def sync_project_milestone_count(project_id):
    from apps.projects.models import Project

    count = Milestone.objects.filter(project_id=project_id).count()
    Project.objects.filter(pk=project_id).update(milestone_count=count)


@receiver(post_save, sender=Milestone)
def sync_project_after_milestone_save(sender, instance, **kwargs):
    project_id = instance.project_id
    transaction.on_commit(lambda: sync_project_milestone_count(project_id))


@receiver(post_delete, sender=Milestone)
def sync_project_after_milestone_delete(sender, instance, **kwargs):
    project_id = instance.project_id
    transaction.on_commit(lambda: sync_project_milestone_count(project_id))


@receiver(pre_save, sender=Repayment)
def remember_previous_repayment_project(sender, instance, **kwargs):
    previous = sender.objects.filter(pk=instance.pk).values(
        "investment__project_id"
    ).first() if instance.pk else None
    instance._previous_repayment_project_id = (
        previous["investment__project_id"] if previous else None
    )


@receiver(post_save, sender=Repayment)
def sync_totals_after_repayment_save(sender, instance, **kwargs):
    project_ids = {instance.investment.project_id}
    previous_project_id = getattr(instance, "_previous_repayment_project_id", None)
    if previous_project_id:
        project_ids.add(previous_project_id)
    transaction.on_commit(
        lambda: [sync_repayment_totals(project_id) for project_id in project_ids]
    )


@receiver(post_delete, sender=Repayment)
def sync_totals_after_repayment_delete(sender, instance, **kwargs):
    project_id = instance.investment.project_id
    transaction.on_commit(lambda: sync_repayment_totals(project_id))
