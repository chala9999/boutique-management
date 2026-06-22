import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function ProduitsScreen() {
  const [search, setSearch] = useState('');
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Récupérer les produits
  const { data: produits, isLoading, refetch } = useQuery({
    queryKey: ['produits', search, selectedBoutique],
    queryFn: () =>
      produitsAPI.getAll({
        search,
        boutique: selectedBoutique,
        actifs: true,
      }),
  });

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const renderProduitItem = ({ item }) => (
    <View style={styles.produitCard}>
      <View style={styles.produitIcon}>
        <Ionicons name="cube" size={32} color={COLORS.primary} />
      </View>

      <View style={styles.produitInfo}>
        <Text style={styles.produitNom}>{item.nom}</Text>
        <Text style={styles.produitReference}>{item.reference}</Text>
        <Text style={styles.produitBoutique}>{item.boutique_nom}</Text>

        <View style={styles.produitDetails}>
          <View style={styles.produitPrice}>
            <Text style={styles.produitPriceLabel}>Prix de vente</Text>
            <Text style={styles.produitPriceValue}>
              {item.prix_vente.toLocaleString()} FCFA
            </Text>
          </View>

          <View
            style={[
              styles.produitStock,
              item.stock_faible && styles.produitStockLow,
            ]}
          >
            <Ionicons
              name={item.stock_faible ? 'alert-circle' : 'cube'}
              size={16}
              color={item.stock_faible ? COLORS.error : COLORS.success}
            />
            <Text
              style={[
                styles.produitStockText,
                item.stock_faible && styles.produitStockTextLow,
              ]}
            >
              Stock: {item.stock_actuel}
            </Text>
          </View>
        </View>

        {item.marge_benefice > 0 && (
          <View style={styles.produitMarge}>
            <Text style={styles.produitMargeText}>
              Marge: {item.marge_benefice.toLocaleString()} FCFA (
              {item.pourcentage_marge.toFixed(1)}%)
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produits</Text>
      </View>

      {/* Filtres */}
      <View style={styles.filters}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.gray500}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.boutiqueFilter}>
          <Ionicons name="storefront" size={16} color={COLORS.gray500} />
          <Text style={styles.boutiqueFilterLabel}>Boutique:</Text>
          <TouchableOpacity
            style={styles.boutiqueFilterButton}
            onPress={() => setSelectedBoutique('')}
          >
            <Text
              style={[
                styles.boutiqueFilterText,
                !selectedBoutique && styles.boutiqueFilterTextActive,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          {boutiques?.results?.slice(0, 2).map((boutique) => (
            <TouchableOpacity
              key={boutique.id}
              style={styles.boutiqueFilterButton}
              onPress={() => setSelectedBoutique(boutique.id.toString())}
            >
              <Text
                style={[
                  styles.boutiqueFilterText,
                  selectedBoutique === boutique.id.toString() &&
                    styles.boutiqueFilterTextActive,
                ]}
                numberOfLines={1}
              >
                {boutique.nom}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des produits */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={produits?.results || []}
          renderItem={renderProduitItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={COLORS.gray400} />
              <Text style={styles.emptyText}>Aucun produit</Text>
            </View>
          }
        />
      )}
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
  filters: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  boutiqueFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  boutiqueFilterLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  boutiqueFilterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  boutiqueFilterText: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  boutiqueFilterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  list: {
    padding: SPACING.md,
  },
  produitCard: {
    flexDirection: 'row',
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
  produitIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  produitInfo: {
    flex: 1,
  },
  produitNom: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  produitReference: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  produitBoutique: {
    fontSize: SIZES.xs,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  produitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  produitPrice: {},
  produitPriceLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  produitPriceValue: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  produitStock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.success + '10',
    gap: SPACING.xs,
  },
  produitStockLow: {
    backgroundColor: COLORS.error + '10',
  },
  produitStockText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  produitStockTextLow: {
    color: COLORS.error,
  },
  produitMarge: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  produitMargeText: {
    fontSize: SIZES.xs,
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