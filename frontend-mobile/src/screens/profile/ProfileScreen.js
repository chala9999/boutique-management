import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const getRoleBadge = () => {
    const config = {
      admin: { color: COLORS.error, label: 'Administrateur' },
      vendeur: { color: COLORS.primary, label: 'Vendeur' },
      comptable: { color: COLORS.success, label: 'Comptable' },
    };
    return config[user?.role] || config.vendeur;
  };

  const roleConfig = getRoleBadge();

  const menuItems = [
    {
      icon: 'person',
      title: 'Informations personnelles',
      subtitle: 'Modifier vos informations',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
    {
      icon: 'key',
      title: 'Changer le mot de passe',
      subtitle: 'Sécurisez votre compte',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'Gérer les alertes',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
    {
      icon: 'help-circle',
      title: 'Aide & Support',
      subtitle: 'Obtenez de l\'aide',
      onPress: () => Alert.alert('Info', 'Fonctionnalité à venir'),
    },
    {
      icon: 'information-circle',
      title: 'À propos',
      subtitle: 'Version 1.0.0',
      onPress: () =>
        Alert.alert(
          'Boutique Manager',
          'Version 1.0.0\n\nGérez vos boutiques facilement'
        ),
    },
  ];

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.profilePicture}>
          <Text style={styles.profileInitial}>
            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.userEmail}>{user?.email || user?.username}</Text>

        <View
          style={[
            styles.roleBadge,
            { backgroundColor: roleConfig.color + '20' },
          ]}
        >
          <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>
            {roleConfig.label}
          </Text>
        </View>
      </View>

      {/* Menu */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          {menuItems.slice(0, 2).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.gray400}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          {menuItems.slice(2, 3).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.gray400}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres</Text>
          {menuItems.slice(3).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.gray400}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
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
    backgroundColor: COLORS.card,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  profileInitial: {
    fontSize: SIZES.xxxl * 1.5,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  roleBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  menuSubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '10',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.error,
  },
});