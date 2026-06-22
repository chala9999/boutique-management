from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/boutiques/', include('boutiques.urls')),
    path('api/produits/', include('produits.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/ventes/', include('ventes.urls')),
    path('api/fournisseurs/', include('fournisseurs.urls')),
    path('api/rapports/', include('rapports.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)