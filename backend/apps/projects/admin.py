from django.contrib import admin

from .models import Project, ProjectCategory, ProjectDocument, ProjectImage


@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 0


class ProjectDocumentInline(admin.TabularInline):
    model = ProjectDocument
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "entrepreneur", "category", "status", "is_verified", "goal_amount", "funded_amount")
    list_filter = ("status", "is_verified", "category")
    search_fields = ("title", "short_description", "entrepreneur__email")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ProjectImageInline, ProjectDocumentInline]
