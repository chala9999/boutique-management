from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenteViewSet

router = DefaultRouter()
router.register(r'', VenteViewSet, basename='vente')

urlpatterns = [
    path('', include(router.urls)),
]