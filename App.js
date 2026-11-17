
import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Pressable,
  Alert,
  Image,
} from "react-native";

import { COLORS } from "./src/theme/colors";

import ParcelRegistrationScreen from "./src/screens/ParcelRegistrationScreen";
import MyParcelsScreen from "./src/screens/MyParcelsScreen";
import ParcelTrackingScreen from "./src/screens/ParcelTrackingScreen";
import StaffDashboardScreen from "./src/screens/StaffDashboardScreen";
import ParcelStatusManagementScreen from
  "./src/screens/ParcelStatusManagementScreen";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("home");

  // PARCEL REGISTRATION
  if (currentScreen === "registration") {
    return (
      <ParcelRegistrationScreen
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  // MY PARCELS
  if (currentScreen === "parcels") {
    return (
      <MyParcelsScreen
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  // PARCEL TRACKING
  if (currentScreen === "tracking") {
    return (
      <ParcelTrackingScreen
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  // STAFF DASHBOARD
  if (currentScreen === "staff") {
    return (
      <StaffDashboardScreen
        onBack={() => setCurrentScreen("home")}
        onManageParcels={() =>
          setCurrentScreen("staffManagement")
        }
      />
    );
  }

  // STAFF PARCEL MANAGEMENT
if (currentScreen === "staffManagement") {
  return (
    <ParcelStatusManagementScreen
      onBack={() => setCurrentScreen("staff")}
    />
  );
}

  // HOME SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={COLORS.background}
        barStyle="dark-content"
      />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require("./assets/svitsai-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Pressable
            onPress={() =>
              Alert.alert(
                "Notifications",
                "No new notifications."
              )
            }
          >
            <Text style={styles.bell}>🔔</Text>
          </Pressable>
        </View>

        {/* WELCOME */}
        <View style={styles.welcome}>
          <Text style={styles.heading}>
            Hello there 👋
          </Text>

          <Text style={styles.description}>
            Where would you like to send a parcel today?
          </Text>
        </View>

        {/* SEND PARCEL */}
        <Pressable
          style={styles.sendCard}
          onPress={() => setCurrentScreen("registration")}
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

        {/* TRACK PARCEL */}
        <Pressable
          style={styles.trackCard}
          onPress={() => setCurrentScreen("tracking")}
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

        {/* RECENT PARCELS */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>
              Your Recent Parcels
            </Text>

            <Pressable
              onPress={() => setCurrentScreen("parcels")}
            >
              <Text style={styles.viewAll}>
                View All →
              </Text>
            </Pressable>
          </View>

          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>

            <Text style={styles.emptyTitle}>
              View your parcel activity
            </Text>

            <Text style={styles.emptyDescription}>
              Check your registered parcels and their details.
            </Text>

            <Pressable
              style={styles.viewParcelsButton}
              onPress={() => setCurrentScreen("parcels")}
            >
              <Text style={styles.viewParcelsText}>
                My Parcels
              </Text>
            </Pressable>
          </View>
        </View>

        {/* STAFF PORTAL */}
        <Pressable
          style={styles.staffCard}
          onPress={() => setCurrentScreen("staff")}
        >
          <Text style={styles.staffIcon}>🛠️</Text>

          <View style={styles.staffContent}>
            <Text style={styles.staffTitle}>
              Staff Portal
            </Text>

            <Text style={styles.staffDescription}>
              Access parcel operations and management.
            </Text>
          </View>

          <Text style={styles.staffArrow}>→</Text>
        </Pressable>

      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>

        <Pressable
          onPress={() => setCurrentScreen("home")}
        >
          <Text style={styles.activeNav}>
            ⌂{"\n"}Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setCurrentScreen("parcels")}
        >
          <Text style={styles.navItem}>
            📦{"\n"}Parcels
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              "Locations",
              "Collection locations coming soon."
            )
          }
        >
          <Text style={styles.navItem}>
            📍{"\n"}Locations
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              "Profile",
              "Your profile is coming soon."
            )
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  logoImage: {
    flex: 1,
    height: 150,
    marginRight: 12,
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

  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  viewAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
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

  viewParcelsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 16,
  },

  viewParcelsText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  staffCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surface,
  },

  staffIcon: {
    fontSize: 27,
    marginRight: 14,
  },

  staffContent: {
    flex: 1,
  },

  staffTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },

  staffDescription: {
    color: "#777777",
    fontSize: 12,
    marginTop: 5,
  },

  staffArrow: {
    color: COLORS.primary,
    fontSize: 23,
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
