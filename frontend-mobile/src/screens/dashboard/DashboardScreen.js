import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();

  // Statistiques des ventes
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['ventes-stats'],
    queryFn: () => ventesAPI.getStatistiques({ periode: 'aujourd_hui' }),
  });

  // Produits en stock faible
  const { data: stockFaible, refetch: refetchStock } = useQuery({
    queryKey: ['stock-faible'],
    queryFn: () => produitsAPI.getStockFaible(),
  });

  // Mes boutiques
  const { data: mesBoutiques, refetch: refetchBoutiques } = useQuery({
    queryKey: ['mes-boutiques'],
    queryFn: () => boutiquesAPI.getMesBoutiques(),
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchStock(), refetchBoutiques()]);
    setRefreshing(false);
  }, []);

  const statCards = [
    {
      title: "CA Aujourd'hui",
      value: `${stats?.chiffre_affaires?.toLocaleString() || 0} FCFA`,
      icon: 'trending-up',
      color: COLORS.success,
      bgColor: COLORS.success + '20',
    },
    {
      title: 'Ventes',
      value: stats?.nombre_ventes || 0,
      icon: 'cart',
      color: COLORS.primary,
      bgColor: COLORS.primary + '20',
    },
    {
      title: 'Bénéfice',
      value: `${stats?.benefice_total?.toLocaleString() || 0} FCFA`,
      icon: 'cash',
      color: COLORS.warning,
      bgColor: COLORS.warning + '20',
    },
    {
      title: 'Stock Faible',
      value: stockFaible?.length || 0,
      icon: 'alert-circle',
      color: COLORS.error,
      bgColor: COLORS.error + '20',
    },
  ];

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>
            {user?.first_name || user?.username} 👋
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          {(stockFaible?.length || 0) > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cartes de statistiques */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.primary }]}
              onPress={() => navigation.navigate('NouvelleVente')}
            >
              <Ionicons name="add-circle" size={32} color="#fff" />
              <Text style={styles.actionText}>Nouvelle Vente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.success }]}
              onPress={() => navigation.navigate('Produits')}
            >
              <Ionicons name="cube" size={32} color="#fff" />
              <Text style={styles.actionText}>Produits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.warning }]}
              onPress={() => navigation.navigate('Ventes')}
            >
              <Ionicons name="receipt" size={32} color="#fff" />
              <Text style={styles.actionText}>Historique</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.info }]}
              onPress={() => navigation.navigate('Boutiques')}
            >
              <Ionicons name="storefront" size={32} color="#fff" />
              <Text style={styles.actionText}>Boutiques</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mes boutiques */}
        {mesBoutiques && mesBoutiques.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes boutiques</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Boutiques')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {mesBoutiques.slice(0, 3).map((boutique) => (
              <View key={boutique.id} style={styles.boutiqueCard}>
                <View style={styles.boutiqueIcon}>
                  <Ionicons name="storefront" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.boutiqueInfo}>
                  <Text style={styles.boutiqueName}>{boutique.nom}</Text>
                  <Text style={styles.boutiqueAddress}>{boutique.adresse}</Text>
                </View>
                <View style={styles.boutiqueStats}>
                  <Text style={styles.boutiqueStatsValue}>
                    {boutique.nombre_produits || 0}
                  </Text>
                  <Text style={styles.boutiqueStatsLabel}>produits</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Alertes stock faible */}
        {stockFaible && stockFaible.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.alertTitle}>
                Produits en stock faible ({stockFaible.length})
              </Text>
            </View>
            {stockFaible.slice(0, 3).map((produit) => (
              <View key={produit.id} style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Ionicons name="cube-outline" size={20} color={COLORS.error} />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertProductName}>{produit.nom}</Text>
                  <Text style={styles.alertBoutique}>{produit.boutique_nom}</Text>
                </View>
                <View style={styles.alertStock}>
                  <Text style={styles.alertStockValue}>Stock: {produit.stock_actuel}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.card,
  },
  greeting: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    fontSize: SIZES.md,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  boutiqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  boutiqueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  boutiqueInfo: {
    flex: 1,
  },
  boutiqueName: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  boutiqueAddress: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  boutiqueStats: {
    alignItems: 'center',
  },
  boutiqueStatsValue: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  boutiqueStatsLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  alertTitle: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  alertInfo: {
    flex: 1,
  },
  alertProductName: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  alertBoutique: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  alertStock: {
    alignItems: 'flex-end',
  },
  alertStockValue: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.error,
  },
});