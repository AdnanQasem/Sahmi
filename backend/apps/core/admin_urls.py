from rest_framework.routers import DefaultRouter

from apps.investments.admin_views import (
    AdminInvestmentViewSet,
    AdminMilestoneViewSet,
    AdminRepaymentViewSet,
)
from apps.projects.admin_views import (
    AdminProjectCategoryViewSet,
    AdminProjectDocumentViewSet,
    AdminProjectImageViewSet,
    AdminProjectViewSet,
)
from apps.users.admin_views import AdminUserViewSet


router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-user")
router.register("categories", AdminProjectCategoryViewSet, basename="admin-category")
router.register("projects", AdminProjectViewSet, basename="admin-project")
router.register("project-images", AdminProjectImageViewSet, basename="admin-project-image")
router.register(
    "project-documents",
    AdminProjectDocumentViewSet,
    basename="admin-project-document",
)
router.register("investments", AdminInvestmentViewSet, basename="admin-investment")
router.register("milestones", AdminMilestoneViewSet, basename="admin-milestone")
router.register("repayments", AdminRepaymentViewSet, basename="admin-repayment")

urlpatterns = router.urls
