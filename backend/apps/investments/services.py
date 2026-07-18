import json
from decimal import Decimal

from django.conf import settings
from django.db.models import Sum

from apps.projects.models import Project

from .models import Investment


def get_project_funding_snapshot(project):
    confirmed = Investment.objects.filter(project=project, status=Investment.Status.CONFIRMED)
    funded_amount = confirmed.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    investor_count = confirmed.values("investor_id").distinct().count()
    funding_percent = round((funded_amount / project.goal_amount) * Decimal("100"), 2) if project.goal_amount else Decimal("0")

    return {
        "funded_amount": funded_amount,
        "investor_count": investor_count,
        "funding_percent": float(funding_percent),
    }


def sync_project_totals(project_or_id):
    project_id = getattr(project_or_id, "pk", project_or_id)
    project = Project.objects.filter(pk=project_id).only("id", "goal_amount").first()
    if not project:
        return None

    snapshot = get_project_funding_snapshot(project)
    Project.objects.filter(pk=project.pk).update(
        funded_amount=snapshot["funded_amount"],
        investor_count=snapshot["investor_count"],
    )
    return snapshot


def publish_investment_confirmed_event(investment_id):
    investment = (
        Investment.objects
        .select_related("investor", "project")
        .filter(pk=investment_id)
        .first()
    )
    if not investment or investment.status != Investment.Status.CONFIRMED:
        return

    snapshot = sync_project_totals(investment.project)
    if not snapshot:
        return

    project = investment.project
    payload = {
        "type": "investment_confirmed",
        "project_id": str(project.id),
        "funded_amount": float(snapshot["funded_amount"]),
        "investor_count": snapshot["investor_count"],
        "funding_percent": snapshot["funding_percent"],
        "payment": {
            "id": str(investment.id),
            "investor_name": investment.investor.full_name or investment.investor.username,
            "amount": float(investment.amount),
            "date": investment.investment_date.isoformat(),
            "payment_method": investment.payment_method,
        },
    }

    try:
        import redis

        r = redis.Redis.from_url(
            settings.CELERY_BROKER_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        r.publish(f"project_{project.id}", json.dumps(payload))
    except Exception as exc:
        print(f"Failed to publish event to Redis: {exc}")
