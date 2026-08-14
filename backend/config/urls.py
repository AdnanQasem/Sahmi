from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.core.contact import ContactMessageView

urlpatterns = [
    path('api/v1/admin/', include('apps.core.admin_urls')),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/", include("apps.projects.urls")),
    path("api/v1/", include("apps.investments.urls")),
    path("api/v1/", include("apps.messaging.urls")),
    path("api/v1/", include("apps.audit.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/contact/", ContactMessageView.as_view(), name="contact-message"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
