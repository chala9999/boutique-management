from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoutiqueViewSet

router = DefaultRouter()
router.register(r'', BoutiqueViewSet, basename='boutique')

urlpatterns = [
    path('', include(router.urls)),
]