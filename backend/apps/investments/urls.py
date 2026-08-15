from rest_framework.routers import DefaultRouter

from .views import InvestmentViewSet, MilestoneViewSet, RepaymentViewSet, WithdrawalRequestViewSet

router = DefaultRouter()
router.register("investments", InvestmentViewSet, basename="investment")
router.register("milestones", MilestoneViewSet, basename="milestone")
router.register("repayments", RepaymentViewSet, basename="repayment")
router.register("withdrawals", WithdrawalRequestViewSet, basename="withdrawal")

urlpatterns = router.urls
