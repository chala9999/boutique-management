import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function VentesScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);

  const { data: ventes, isLoading, refetch } = useQuery({
    queryKey: ['ventes'],
    queryFn: () => ventesAPI.getAll({}),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'completee':
        return COLORS.success;
      case 'en_cours':
        return COLORS.warning;
      case 'annulee':
        return COLORS.error;
      default:
        return COLORS.gray500;
    }
  };

  const getPaiementColor = (statut) => {
    switch (statut) {
      case 'paye':
        return COLORS.success;
      case 'impaye':
        return COLORS.error;
      case 'partiel':
        return COLORS.warning;
      default:
        return COLORS.gray500;
    }
  };

  const renderVenteItem = ({ item }) => (
    <TouchableOpacity style={styles.venteCard}>
      <View style={styles.venteHeader}>
        <View style={styles.venteNumberContainer}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
          <Text style={styles.venteNumber}>{item.numero_vente}</Text>
        </View>
        <Text style={styles.venteDate}>
          {format(new Date(item.date_vente), 'dd/MM/yyyy HH:mm', { locale: fr })}
        </Text>
      </View>

      <View style={styles.venteBody}>
        <View style={styles.venteInfo}>
          <Text style={styles.venteLabel}>Boutique</Text>
          <Text style={styles.venteValue}>{item.boutique_nom}</Text>
        </View>

        {item.client_nom && (
          <View style={styles.venteInfo}>
            <Text style={styles.venteLabel}>Client</Text>
            <Text style={styles.venteValue}>{item.client_nom}</Text>
          </View>
        )}

        <View style={styles.venteInfo}>
          <Text style={styles.venteLabel}>Montant</Text>
          <Text style={styles.venteMontant}>
            {item.montant_final.toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      <View style={styles.venteFooter}>
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              { backgroundColor: getStatutColor(item.statut) + '20' },
            ]}
          >
            <Text style={[styles.badgeText, { color: getStatutColor(item.statut) }]}>
              {item.statut === 'completee' ? 'Complétée' : item.statut}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: getPaiementColor(item.statut_paiement) + '20' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: getPaiementColor(item.statut_paiement) },
              ]}
            >
              {item.statut_paiement === 'paye'
                ? 'Payé'
                : item.statut_paiement === 'impaye'
                ? 'Impayé'
                : 'Partiel'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventes</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('NouvelleVente')}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Liste des ventes */}
      <FlatList
        data={ventes?.results || []}
        renderItem={renderVenteItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={COLORS.gray400} />
            <Text style={styles.emptyText}>Aucune vente</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('NouvelleVente')}
            >
              <Text style={styles.emptyButtonText}>Créer une vente</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  newButton: {
    padding: SPACING.sm,
  },
  list: {
    padding: SPACING.lg,
  },
  venteCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  venteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  venteNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venteNumber: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  venteDate: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  venteBody: {
    marginBottom: SPACING.md,
  },
  venteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  venteLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  venteValue: {
    fontSize: SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  venteMontant: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  venteFooter: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: '600',
  },
});