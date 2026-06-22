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
import { boutiquesAPI } from '../../api/boutiques';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function BoutiquesScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: boutiques, isLoading, refetch } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const getTypeBadge = (type) => {
    const config = {
      physique: { color: COLORS.primary, icon: 'storefront', label: 'Physique' },
      en_ligne: { color: COLORS.success, icon: 'globe', label: 'En ligne' },
      hybride: { color: COLORS.warning, icon: 'apps', label: 'Hybride' },
    };
    return config[type] || config.physique;
  };

  const renderBoutiqueItem = ({ item }) => {
    const typeConfig = getTypeBadge(item.type_boutique);

    return (
      <TouchableOpacity style={styles.boutiqueCard}>
        <View style={styles.boutiqueHeader}>
          <View
            style={[
              styles.boutiqueIcon,
              { backgroundColor: typeConfig.color + '20' },
            ]}
          >
            <Ionicons name={typeConfig.icon} size={32} color={typeConfig.color} />
          </View>

          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeConfig.color + '20' },
            ]}
          >
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.boutiqueBody}>
          <Text style={styles.boutiqueNom}>{item.nom}</Text>

          <View style={styles.boutiqueDetail}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.boutiqueDetailText} numberOfLines={1}>
              {item.adresse}
            </Text>
          </View>

          <View style={styles.boutiqueDetail}>
            <Ionicons name="call" size={16} color={COLORS.textSecondary} />
            <Text style={styles.boutiqueDetailText}>{item.telephone}</Text>
          </View>

          {item.email && (
            <View style={styles.boutiqueDetail}>
              <Ionicons name="mail" size={16} color={COLORS.textSecondary} />
              <Text style={styles.boutiqueDetailText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.boutiqueFooter}>
          <View style={styles.stat}>
            <Ionicons name="cube" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{item.nombre_produits || 0}</Text>
            <Text style={styles.statLabel}>produits</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Boutiques</Text>
      </View>

      {/* Liste des boutiques */}
      <FlatList
        data={boutiques?.results || []}
        renderItem={renderBoutiqueItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color={COLORS.gray400} />
            <Text style={styles.emptyText}>Aucune boutique</Text>
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
  list: {
    padding: SPACING.lg,
  },
  boutiqueCard: {
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
  boutiqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  boutiqueIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  boutiqueBody: {
    marginBottom: SPACING.md,
  },
  boutiqueNom: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  boutiqueDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  boutiqueDetailText: {
    flex: 1,
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  boutiqueFooter: {
    flexDirection: 'row',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
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
  },
});