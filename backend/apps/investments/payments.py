from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol
from uuid import uuid4

from django.conf import settings
from django.utils.module_loading import import_string


@dataclass(frozen=True)
class PayoutResult:
    transaction_id: str
    status: str = "released"


class PaymentProvider(Protocol):
    def release(
        self,
        *,
        withdrawal_id: str,
        amount: Decimal,
        recipient_id: str,
        metadata: dict | None = None,
    ) -> PayoutResult: ...


class MockPaymentProvider:
    """Deterministic contract-compatible stand-in for a future payout gateway."""

    def release(
        self,
        *,
        withdrawal_id: str,
        amount: Decimal,
        recipient_id: str,
        metadata: dict | None = None,
    ) -> PayoutResult:
        return PayoutResult(transaction_id=f"SIM-{uuid4().hex.upper()}")


def get_payment_provider() -> PaymentProvider:
    provider_class = import_string(settings.PAYMENT_PROVIDER)
    return provider_class()
