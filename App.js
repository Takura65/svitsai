
import React from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Pressable,
  Alert,
} from "react-native";

import { COLORS } from "./src/theme/colors";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={COLORS.background}
        barStyle="dark-content"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>📦</Text>
          </View>

          <View style={styles.brand}>
            <Text style={styles.brandName}>Svitsai</Text>
            <Text style={styles.tagline}>
              Send with confidence.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert("Notifications", "No new notifications.")
            }
          >
            <Text style={styles.bell}>🔔</Text>
          </Pressable>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcome}>
          <Text style={styles.heading}>Hello there 👋</Text>

          <Text style={styles.description}>
            Where would you like to send a parcel today?
          </Text>
        </View>

        {/* Send Parcel Card */}
        <Pressable
          style={styles.sendCard}
          onPress={() =>
            Alert.alert(
              "Svitsai",
              "Parcel registration coming soon!"
            )
          }
        >
          <Text style={styles.cardIcon}>📦</Text>

          <Text style={styles.sendTitle}>
            Send a Parcel
          </Text>

          <Text style={styles.sendDescription}>
            Register a parcel for delivery.
          </Text>

          <Text style={styles.arrow}>↗</Text>
        </Pressable>

        {/* Track Parcel Card */}
        <Pressable
          style={styles.trackCard}
          onPress={() =>
            Alert.alert(
              "Svitsai",
              "Parcel tracking coming soon!"
            )
          }
        >
          <Text style={styles.cardIcon}>🔍</Text>

          <Text style={styles.trackTitle}>
            Track a Parcel
          </Text>

          <Text style={styles.trackDescription}>
            Check your parcel's delivery status.
          </Text>

          <Text style={styles.trackArrow}>↗</Text>
        </Pressable>

        {/* Recent Parcels */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>
            Your Recent Parcels
          </Text>

          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>

            <Text style={styles.emptyTitle}>
              No parcels yet
            </Text>

            <Text style={styles.emptyDescription}>
              Your parcel activity will appear here.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Text style={styles.activeNav}>
          ⌂{"\n"}Home
        </Text>

        <Pressable
          onPress={() =>
            Alert.alert("Parcels", "Your parcels will appear here.")
          }
        >
          <Text style={styles.navItem}>
            📦{"\n"}Parcels
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert("Locations", "Collection locations coming soon.")
          }
        >
          <Text style={styles.navItem}>
            📍{"\n"}Locations
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert("Profile", "Your profile is coming soon.")
          }
        >
          <Text style={styles.navItem}>
            👤{"\n"}Profile
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },

  logo: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  logoIcon: {
    fontSize: 25,
  },

  brand: {
    flex: 1,
    marginLeft: 12,
  },

  brandName: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.text,
  },

  tagline: {
    fontSize: 12,
    color: COLORS.primary,
  },

  bell: {
    fontSize: 22,
  },

  welcome: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 24,
  },

  heading: {
    fontSize: 27,
    fontWeight: "bold",
    color: COLORS.text,
  },

  description: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },

  sendCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 20,
    marginBottom: 16,
  },

  cardIcon: {
    fontSize: 30,
    marginBottom: 15,
  },

  sendTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  sendDescription: {
    color: "#E8F3E4",
    fontSize: 14,
    marginTop: 7,
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 25,
    position: "absolute",
    right: 20,
    top: 20,
  },

  trackCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 20,
  },

  trackTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
  },

  trackDescription: {
    color: "#666666",
    fontSize: 14,
    marginTop: 7,
  },

  trackArrow: {
    color: COLORS.primary,
    fontSize: 25,
    position: "absolute",
    right: 20,
    top: 20,
  },

  recentSection: {
    margin: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 14,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },

  emptyDescription: {
    fontSize: 13,
    color: "#666666",
    marginTop: 6,
    textAlign: "center",
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },

  activeNav: {
    color: COLORS.primary,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 12,
  },

  navItem: {
    color: "#777777",
    textAlign: "center",
    fontSize: 12,
  },
});
