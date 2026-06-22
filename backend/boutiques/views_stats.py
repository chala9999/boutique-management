from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from django.db import models
from .models import Boutique
from produits.models import Produit
from ventes.models import Vente, LigneVente
from clients.models import Client

class DashboardStatsAvanceView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        periode = request.query_params.get('periode', '30j')
        
        # Filtrer les boutiques selon le rôle
        if user.role == 'admin':
            boutiques = Boutique.objects.all()
        else:
            boutiques = Boutique.objects.filter(
                Q(proprietaire=user) | Q(gestionnaires=user)
            ).distinct()
        
        # ✅ Vérification si aucune boutique
        if not boutiques.exists():
            return Response({
                'stats_globales': {
                    'chiffre_affaires': 0,
                    'evolution_ca': 0,
                    'nombre_ventes': 0,
                    'evolution_ventes': 0,
                    'nombre_boutiques': 0,
                    'nombre_clients': 0,
                    'nombre_produits': 0,
                    'produits_stock_faible': 0,
                },
                'ventes_par_paiement': [],
                'top_produits': [],
                'boutique_active': None,
                'activites_recentes': [],
                'ventes_par_jour': [],
                'periode': periode,
                'date_debut': timezone.now().strftime('%d/%m/%Y'),
                'date_fin': timezone.now().strftime('%d/%m/%Y'),
            })
        
        # Dates
        aujourd_hui = timezone.now().date()
        
        if periode == 'aujourd_hui':
            date_debut = timezone.make_aware(datetime.combine(aujourd_hui, datetime.min.time()))
            date_fin = timezone.make_aware(datetime.combine(aujourd_hui, datetime.max.time()))
        elif periode == '7j':
            date_debut = timezone.now() - timedelta(days=7)
            date_fin = timezone.now()
        elif periode == 'mois':
            date_debut = timezone.make_aware(datetime(aujourd_hui.year, aujourd_hui.month, 1))
            date_fin = timezone.now()
        else:  # 30j par défaut
            date_debut = timezone.now() - timedelta(days=30)
            date_fin = timezone.now()
        
        # ✅ Ventes de la période (statut = 'completee')
        ventes_periode = Vente.objects.filter(
            boutique__in=boutiques,
            date_vente__range=[date_debut, date_fin],
            statut='completee'  # ← CHANGÉ
        )
        
        # Ventes de la période précédente
        duree = (date_fin - date_debut).days
        date_debut_prec = date_debut - timedelta(days=duree if duree > 0 else 1)
        date_fin_prec = date_debut
        ventes_periode_prec = Vente.objects.filter(
            boutique__in=boutiques,
            date_vente__range=[date_debut_prec, date_fin_prec],
            statut='completee'
        )
        
        # ✅ Chiffre d'affaires (montant_final)
        ca_periode = ventes_periode.aggregate(total=Sum('montant_final'))['total'] or 0
        ca_periode_prec = ventes_periode_prec.aggregate(total=Sum('montant_final'))['total'] or 0
        
        # Calcul évolution
        if ca_periode_prec > 0:
            evolution_ca = ((ca_periode - ca_periode_prec) / ca_periode_prec) * 100
        else:
            evolution_ca = 100 if ca_periode > 0 else 0
        
        # Nombre de ventes
        nombre_ventes = ventes_periode.count()
        nombre_ventes_prec = ventes_periode_prec.count()
        
        if nombre_ventes_prec > 0:
            evolution_ventes = ((nombre_ventes - nombre_ventes_prec) / nombre_ventes_prec) * 100
        else:
            evolution_ventes = 100 if nombre_ventes > 0 else 0
        
        # Statistiques globales
        stats_globales = {
            'chiffre_affaires': ca_periode,
            'evolution_ca': round(evolution_ca, 1),
            'nombre_ventes': nombre_ventes,
            'evolution_ventes': round(evolution_ventes, 1),
            'nombre_boutiques': boutiques.count(),
            'nombre_clients': Client.objects.filter(boutique__in=boutiques).count(),
            'nombre_produits': Produit.objects.filter(boutique__in=boutiques).count(),
            'produits_stock_faible': Produit.objects.filter(
                boutique__in=boutiques,
                stock_actuel__lte=F('stock_minimum')
            ).count(),
        }
        
        # ✅ Ventes par mode de paiement (montant_final)
        ventes_par_paiement = list(ventes_periode.values('mode_paiement').annotate(
            total=Sum('montant_final'),  # ← CHANGÉ
        ).order_by('-total'))
        
        # Top 5 produits
        top_produits = list(LigneVente.objects.filter(
            vente__in=ventes_periode
        ).values(
            'produit__id',
            'produit__nom'
        ).annotate(
            quantite=Sum('quantite'),
            total=Sum('sous_total')  # ← CHANGÉ (prix_total n'existe pas)
        ).order_by('-quantite')[:5])
        
        # Boutique la plus active
        boutique_active = list(ventes_periode.values(
            'boutique__id',
            'boutique__nom'
        ).annotate(
            total_ventes=Count('id'),
            total_ca=Sum('montant_final')  # ← CHANGÉ
        ).order_by('-total_ca')[:1])
        
        # Activités récentes (10 dernières ventes)
        ventes_recentes = Vente.objects.filter(
            boutique__in=boutiques
        ).select_related('client', 'boutique').order_by('-date_vente')[:10]
        
        activites = []
        for vente in ventes_recentes:
            activites.append({
                'id': vente.id,
                'type': 'vente',
                'montant': vente.montant_final,  # ← CHANGÉ
                'client': vente.client.nom_complet if vente.client else 'Client inconnu',
                'boutique': vente.boutique.nom,
                'date': vente.date_vente.strftime('%d/%m/%Y %H:%M'),
                'date_objet': vente.date_vente
            })
        
        # ✅ Ventes par jour pour le graphique (montant_final)
        ventes_par_jour = []
        for i in range(30, -1, -1):
            jour = timezone.now() - timedelta(days=i)
            jour_debut = jour.replace(hour=0, minute=0, second=0, microsecond=0)
            jour_fin = jour.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            ventes_jour = Vente.objects.filter(
                boutique__in=boutiques,
                date_vente__range=[jour_debut, jour_fin],
                statut='completee'
            )
            
            ventes_par_jour.append({
                'date': jour.strftime('%Y-%m-%d'),
                'total': ventes_jour.aggregate(total=Sum('montant_final'))['total'] or 0,
                'nombre': ventes_jour.count()
            })
        
        return Response({
            'stats_globales': stats_globales,
            'ventes_par_paiement': ventes_par_paiement,
            'top_produits': top_produits,
            'boutique_active': boutique_active[0] if boutique_active else None,
            'activites_recentes': activites,
            'ventes_par_jour': ventes_par_jour,
            'periode': periode,
            'date_debut': date_debut.strftime('%d/%m/%Y'),
            'date_fin': date_fin.strftime('%d/%m/%Y'),
        })