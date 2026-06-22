from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from calendar import monthrange

from boutiques.models import Boutique
from produits.models import Produit
from ventes.models import Vente, LigneVente
from clients.models import Client
from users.models import User
from core.permissions import IsAdminOrComptable
from core.permissions import IsAdmin, IsAdminOrComptable

class RapportVentesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrComptable]
    permission_classes = [IsAuthenticated]
    
    
    def get(self, request):
        user = request.user
        periode = request.query_params.get('periode', 'mois')  # jour, semaine, mois, annee, personnalise
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        boutique_id = request.query_params.get('boutique')
        vendeur_id = request.query_params.get('vendeur')
        
        # Filtrer les boutiques selon le rôle
        if user.role == 'admin':
            boutiques = Boutique.objects.all()
        else:
            boutiques = Boutique.objects.filter(
                Q(proprietaire=user) | Q(gestionnaires=user)
            ).distinct()
        
        # Filtrer par boutique spécifique
        if boutique_id:
            boutiques = boutiques.filter(id=boutique_id)
        
        # Déterminer la période
        today = timezone.now().date()
        
        if periode == 'personnalise' and date_debut and date_fin:
            start_date = datetime.strptime(date_debut, '%Y-%m-%d').date()
            end_date = datetime.strptime(date_fin, '%Y-%m-%d').date()
        elif periode == 'jour':
            start_date = today
            end_date = today
        elif periode == 'semaine':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif periode == 'mois':
            start_date = today.replace(day=1)
            end_date = today
        elif periode == 'annee':
            start_date = today.replace(month=1, day=1)
            end_date = today
        else:
            start_date = today - timedelta(days=30)
            end_date = today
        
        # Convertir en datetime
        start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        
        # Filtrer les ventes
        ventes = Vente.objects.filter(
            boutique__in=boutiques,
            date_vente__range=[start_datetime, end_datetime],
            statut='completee'
        )
        
        if vendeur_id:
            ventes = ventes.filter(vendeur_id=vendeur_id)
        
        # Agrégations
        total_ventes = ventes.count()
        chiffre_affaires = ventes.aggregate(total=Sum('montant_final'))['total'] or 0
        
        # Calcul du bénéfice
        benefice_total = sum(v.benefice_total for v in ventes)
        
        # Vente moyenne
        vente_moyenne = chiffre_affaires / total_ventes if total_ventes > 0 else 0
        
        # Top produits
        top_produits = list(LigneVente.objects.filter(
            vente__in=ventes
        ).values(
            'produit__id',
            'produit__nom',
            'produit__reference'
        ).annotate(
            quantite=Sum('quantite'),
            total=Sum('sous_total')
        ).order_by('-quantite')[:10])
        
        # Ventes par jour
        ventes_par_jour = []
        current_date = start_date
        while current_date <= end_date:
            jour_debut = timezone.make_aware(datetime.combine(current_date, datetime.min.time()))
            jour_fin = timezone.make_aware(datetime.combine(current_date, datetime.max.time()))
            
            ventes_jour = ventes.filter(date_vente__range=[jour_debut, jour_fin])
            ventes_par_jour.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'total': ventes_jour.aggregate(total=Sum('montant_final'))['total'] or 0,
                'nombre': ventes_jour.count()
            })
            current_date += timedelta(days=1)
        
        # Par mode de paiement
        paiements = list(ventes.values('mode_paiement').annotate(
            total=Sum('montant_final'),
            nombre=Count('id')
        ))
        
        # Par vendeur
        par_vendeur = []
        if not vendeur_id:
            par_vendeur = list(ventes.values(
                'vendeur__id',
                'vendeur__first_name',
                'vendeur__last_name'
            ).annotate(
                total=Sum('montant_final'),
                nombre=Count('id')
            ).order_by('-total')[:10])
        
        return Response({
            'periode': {
                'debut': start_date.strftime('%d/%m/%Y'),
                'fin': end_date.strftime('%d/%m/%Y'),
                'type': periode
            },
            'recap': {
                'total_ventes': total_ventes,
                'chiffre_affaires': chiffre_affaires,
                'benefice_total': benefice_total,
                'vente_moyenne': vente_moyenne,
            },
            'top_produits': top_produits,
            'ventes_par_jour': ventes_par_jour,
            'par_mode_paiement': paiements,
            'par_vendeur': par_vendeur,
        })


class RapportStockView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrComptable]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
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
        
        produits = Produit.objects.filter(boutique__in=boutiques)
        
        # Statistiques globales
        total_produits = produits.count()
        valeur_stock_total = sum(p.prix_achat * p.stock_actuel for p in produits)
        valeur_vente_potentielle = sum(p.prix_vente * p.stock_actuel for p in produits)
        
        # Stock faible
        stock_faible = produits.filter(stock_actuel__lte=F('stock_minimum'))
        
        # Produits en rupture
        rupture = produits.filter(stock_actuel=0)
        
        # Top stock (plus grande valeur)
        top_valeur = list(produits.order_by('-prix_achat')[:10].values(
            'id', 'nom', 'reference', 'prix_achat', 'stock_actuel'
        ))
        
        # Top quantité
        top_quantite = list(produits.order_by('-stock_actuel')[:10].values(
            'id', 'nom', 'reference', 'stock_actuel', 'prix_vente'
        ))
        
        # Par catégorie
        par_categorie = list(produits.values(
            'categorie__id',
            'categorie__nom'
        ).annotate(
            total_valeur=Sum(F('prix_achat') * F('stock_actuel')),
            total_produits=Count('id')
        ).order_by('-total_valeur'))
        
        return Response({
            'recap': {
                'total_produits': total_produits,
                'valeur_stock_total': valeur_stock_total,
                'valeur_vente_potentielle': valeur_vente_potentielle,
                'stock_faible': stock_faible.count(),
                'rupture': rupture.count(),
            },
            'stock_faible_list': list(stock_faible.values(
                'id', 'nom', 'reference', 'stock_actuel', 'stock_minimum', 'prix_vente'
            )),
            'rupture_list': list(rupture.values(
                'id', 'nom', 'reference', 'prix_vente'
            )),
            'top_valeur': top_valeur,
            'top_quantite': top_quantite,
            'par_categorie': par_categorie,
        })


class RapportFinancesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrComptable]
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
        
        # Chiffre d'affaires par mois
        ca_par_mois = []
        for mois in range(1, 13):
            ventes_mois = ventes.filter(date_vente__month=mois)
            ca_par_mois.append({
                'mois': mois,
                'nom_mois': datetime(annee, mois, 1).strftime('%B'),
                'ca': ventes_mois.aggregate(total=Sum('montant_final'))['total'] or 0,
                'nombre_ventes': ventes_mois.count(),
                'benefice': sum(v.benefice_total for v in ventes_mois)
            })
        
        # Clients ayant le plus dépensé
        top_clients = list(ventes.values(
            'client__id',
            'client__nom',
            'client__prenom',
            'client__telephone'
        ).annotate(
            total_achats=Sum('montant_final'),
            nombre_achats=Count('id')
        ).order_by('-total_achats')[:10])
        
        # Créances (ventes impayées ou partiellement payées)
        creances = Vente.objects.filter(
            boutique__in=boutiques,
            statut_paiement__in=['impaye', 'partiel']
        )
        
        total_creances = creances.aggregate(total=Sum('montant_restant'))['total'] or 0
        
        # Évolution par rapport à l'année précédente
        ventes_annee_prec = Vente.objects.filter(
            boutique__in=boutiques,
            date_vente__year=annee-1,
            statut='completee'
        )
        ca_annee_prec = ventes_annee_prec.aggregate(total=Sum('montant_final'))['total'] or 0
        ca_actuel = ventes.aggregate(total=Sum('montant_final'))['total'] or 0
        
        evolution = ((ca_actuel - ca_annee_prec) / ca_annee_prec * 100) if ca_annee_prec > 0 else 0
        
        return Response({
            'annee': annee,
            'recap': {
                'ca_total': ca_actuel,
                'ca_annee_precedente': ca_annee_prec,
                'evolution': round(evolution, 2),
                'total_ventes': ventes.count(),
                'total_creances': total_creances,
                'nombre_creances': creances.count(),
            },
            'ca_par_mois': ca_par_mois,
            'top_clients': top_clients,
        })


class RapportVendeursView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        periode = request.query_params.get('periode', 'mois')
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
        
        # Vendeurs ayant vendu dans les boutiques
        vendeurs = User.objects.filter(
            Q(boutiques_proprietaire__in=boutiques) | Q(boutiques_gerees__in=boutiques)
        ).distinct()
        
        # Performance par vendeur
        performance = []
        for vendeur in vendeurs:
            ventes_vendeur = Vente.objects.filter(
                vendeur=vendeur,
                boutique__in=boutiques,
                date_vente__gte=start_datetime,
                statut='completee'
            )
            
            performance.append({
                'vendeur_id': vendeur.id,
                'vendeur_nom': f"{vendeur.first_name} {vendeur.last_name}",
                'username': vendeur.username,
                'total_ventes': ventes_vendeur.count(),
                'chiffre_affaires': ventes_vendeur.aggregate(total=Sum('montant_final'))['total'] or 0,
                'benefice': sum(v.benefice_total for v in ventes_vendeur),
                'vente_moyenne': ventes_vendeur.aggregate(total=Sum('montant_final'))['total'] / ventes_vendeur.count() if ventes_vendeur.count() > 0 else 0
            })
        
        # Trier par chiffre d'affaires
        performance.sort(key=lambda x: x['chiffre_affaires'], reverse=True)
        
        return Response({
            'periode': periode,
            'date_debut': start_date.strftime('%d/%m/%Y'),
            'performance': performance,
            'total_chiffre': sum(p['chiffre_affaires'] for p in performance),
            'total_ventes': sum(p['total_ventes'] for p in performance),
            'meilleur_vendeur': performance[0] if performance else None,
        })