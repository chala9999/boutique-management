from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoutiqueViewSet
from .views_stats import DashboardStatsAvanceView

router = DefaultRouter()
router.register(r'', BoutiqueViewSet, basename='boutique')

urlpatterns = [
    path('', include(router.urls)),
]


router = DefaultRouter()
router.register(r'', BoutiqueViewSet, basename='boutique')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats-avance/', DashboardStatsAvanceView.as_view(), name='dashboard-stats-avance'),
]