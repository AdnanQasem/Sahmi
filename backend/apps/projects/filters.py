import django_filters

from .models import Project


class ProjectFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    min_goal = django_filters.NumberFilter(field_name="goal_amount", lookup_expr="gte")
    max_goal = django_filters.NumberFilter(field_name="goal_amount", lookup_expr="lte")

    class Meta:
        model = Project
        fields = ["status", "is_verified", "category", "location", "min_goal", "max_goal"]
