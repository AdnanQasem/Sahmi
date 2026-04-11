from rest_framework.routers import DefaultRouter

from .views import ProjectCategoryViewSet, ProjectViewSet

router = DefaultRouter()
router.register("categories", ProjectCategoryViewSet, basename="category")
router.register("projects", ProjectViewSet, basename="project")

urlpatterns = router.urls
