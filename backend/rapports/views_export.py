from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse
from django.db.models import Q, Sum, Count  # Ajoute Count ici
from django.utils import timezone
from datetime import datetime, timedelta
from .export import ExportService
from ventes.models import Vente
from produits.models import Produit
from boutiques.models import Boutique  # Ajoute cet import
from users.models import User  # Ajoute cet import


class ExportVentesExcelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Filtrer les ventes
        if user.role == 'admin':
            ventes = Vente.objects.all()
        else:
            ventes = Vente.objects.filter(
                Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
            ).distinct()
        
        # Appliquer les filtres de date
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        
        if date_debut:
            ventes = ventes.filter(date_vente__date__gte=date_debut)
        if date_fin:
            ventes = ventes.filter(date_vente__date__lte=date_fin)
        
        ventes = ventes.select_related('boutique', 'vendeur', 'client').order_by('-date_vente')
        
        excel_file = ExportService.export_ventes_excel(ventes)
        
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=rapport_ventes_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        return response


class ExportStockExcelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'admin':
            produits = Produit.objects.all()
        else:
            produits = Produit.objects.filter(
                Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
            ).distinct()
        
        produits = produits.select_related('categorie', 'boutique').order_by('boutique__nom', 'nom')
        
        excel_file = ExportService.export_produits_excel(produits)
        
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=rapport_stocks_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        return response


class ExportVendeursExcelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        periode = request.query_params.get('periode', 'mois')
        
        # Déterminer la période
        today = timezone.now().date()
        
        if periode == 'mois':
            start_date = today.replace(day=1)
        elif periode == 'semaine':
            start_date = today - timedelta(days=today.weekday())
        elif periode == 'annee':
            start_date = today.replace(month=1, day=1)
        else:
            start_date = today - timedelta(days=30)
        
        start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        
        # Filtrer les boutiques
        if user.role == 'admin':
            boutiques = Boutique.objects.all()
        else:
            boutiques = Boutique.objects.filter(
                Q(proprietaire=user) | Q(gestionnaires=user)
            ).distinct()
        
        # Vendeurs ayant vendu
        vendeurs = User.objects.filter(
            Q(boutiques__in=boutiques) | Q(boutiques_gerees__in=boutiques)
        ).distinct()
        
        # Performance
        performance = []
        for vendeur in vendeurs:
            ventes_vendeur = Vente.objects.filter(
                vendeur=vendeur,
                boutique__in=boutiques,
                date_vente__gte=start_datetime,
                statut='completee'
            )
            
            performance.append({
                'vendeur_nom': f"{vendeur.first_name} {vendeur.last_name}",
                'username': vendeur.username,
                'total_ventes': ventes_vendeur.count(),
                'chiffre_affaires': ventes_vendeur.aggregate(total=Sum('montant_final'))['total'] or 0,
                'benefice': sum(v.benefice_total for v in ventes_vendeur),
                'vente_moyenne': (ventes_vendeur.aggregate(total=Sum('montant_final'))['total'] or 0) / ventes_vendeur.count() if ventes_vendeur.count() > 0 else 0
            })
        
        performance.sort(key=lambda x: x['chiffre_affaires'], reverse=True)
        
        excel_file = ExportService.export_vendeurs_excel({'performance': performance})
        
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=performance_vendeurs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        return response


class ExportFinancesExcelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        annee = int(request.query_params.get('annee', timezone.now().year))
        boutique_id = request.query_params.get('boutique')
        
        # Filtrer les boutiques
        if user.role == 'admin':
            boutiques = Boutique.objects.all()
        else:
            boutiques = Boutique.objects.filter(
                Q(proprietaire=user) | Q(gestionnaires=user)
            ).distinct()
        
        if boutique_id:
            boutiques = boutiques.filter(id=boutique_id)
        
        # Ventes de l'année
        ventes = Vente.objects.filter(
            boutique__in=boutiques,
            date_vente__year=annee,
            statut='completee'
        )
        
        # CA par mois
        ca_par_mois = []
        from calendar import monthrange
        for mois in range(1, 13):
            ventes_mois = ventes.filter(date_vente__month=mois)
            ca_par_mois.append({
                'nom_mois': datetime(annee, mois, 1).strftime('%B'),
                'ca': ventes_mois.aggregate(total=Sum('montant_final'))['total'] or 0,
                'nombre_ventes': ventes_mois.count(),
                'benefice': sum(v.benefice_total for v in ventes_mois)
            })
        
        # Top clients
        top_clients = list(ventes.values(
            'client__id',
            'client__nom',
            'client__prenom',
            'client__telephone'
        ).annotate(
            total_achats=Sum('montant_final'),
            nombre_achats=Count('id')
        ).order_by('-total_achats')[:10])
        
        data = {
            'ca_par_mois': ca_par_mois,
            'top_clients': top_clients,
        }
        
        excel_file = ExportService.export_finances_excel(data)
        
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=rapport_finances_{annee}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        return response