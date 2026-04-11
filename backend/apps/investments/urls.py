from rest_framework.routers import DefaultRouter

from .views import InvestmentViewSet, MilestoneViewSet, RepaymentViewSet

router = DefaultRouter()
router.register("investments", InvestmentViewSet, basename="investment")
router.register("milestones", MilestoneViewSet, basename="milestone")
router.register("repayments", RepaymentViewSet, basename="repayment")

urlpatterns = router.urls
