from django.urls import path
from .views import (
    RapportVentesView,
    RapportStockView,
    RapportFinancesView,
    RapportVendeursView
)
from .views_export import (
    ExportVentesExcelView,
    ExportStockExcelView,
    ExportVendeursExcelView,
    ExportFinancesExcelView
)

urlpatterns = [
     # Rapports
    path('ventes/', RapportVentesView.as_view(), name='rapport-ventes'),
    path('stock/', RapportStockView.as_view(), name='rapport-stock'),
    path('finances/', RapportFinancesView.as_view(), name='rapport-finances'),
    path('vendeurs/', RapportVendeursView.as_view(), name='rapport-vendeurs'),
    
    # Exports
    path('export/ventes/', ExportVentesExcelView.as_view(), name='export-ventes'),
    path('export/stock/', ExportStockExcelView.as_view(), name='export-stock'),
    path('export/vendeurs/', ExportVendeursExcelView.as_view(), name='export-vendeurs'),
    path('export/finances/', ExportFinancesExcelView.as_view(), name='export-finances'),
]