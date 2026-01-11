from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, ProduitViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'', ProduitViewSet, basename='produit')

urlpatterns = [
    path('', include(router.urls)),
]