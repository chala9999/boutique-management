import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import VentesScreen from '../screens/ventes/VentesScreen';
import NouvelleVenteScreen from '../screens/ventes/NouvelleVenteScreen';
import ProduitsScreen from '../screens/produits/ProduitsScreen';
import BoutiquesScreen from '../screens/boutiques/BoutiquesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation avec tabs (pour les utilisateurs connectés)
function MainTabs() {
  const { user } = useAuthStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Ventes') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Produits') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Boutiques') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Ventes" component={VentesScreen} />
      <Tab.Screen name="Produits" component={ProduitsScreen} />
      <Tab.Screen name="Boutiques" component={BoutiquesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Navigation principale
export default function AppNavigator() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return null; // On pourrait ajouter un splash screen ici
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Routes publiques
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Routes protégées
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="NouvelleVente" 
              component={NouvelleVenteScreen}
              options={{
                headerShown: true,
                title: 'Nouvelle Vente',
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}