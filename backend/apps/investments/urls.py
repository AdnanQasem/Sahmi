from rest_framework.routers import DefaultRouter

from .views import (
    InvestmentViewSet,
    MilestoneViewSet,
    RepaymentTransferViewSet,
    RepaymentPlanViewSet,
    RepaymentViewSet,
    WithdrawalRequestViewSet,
)

router = DefaultRouter()
router.register("investments", InvestmentViewSet, basename="investment")
router.register("milestones", MilestoneViewSet, basename="milestone")
router.register("repayments", RepaymentViewSet, basename="repayment")
router.register("repayment-plans", RepaymentPlanViewSet, basename="repayment-plan")
router.register("repayment-transfers", RepaymentTransferViewSet, basename="repayment-transfer")
router.register("withdrawals", WithdrawalRequestViewSet, basename="withdrawal")

urlpatterns = router.urls
