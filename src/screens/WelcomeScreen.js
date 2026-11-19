import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
} from "react-native";

import { COLORS } from "../theme/colors";
import { getUserProfile } from "../services/userProfileStorage";

export default function WelcomeScreen({
  onEnterHome,
  onSendParcel,
  onTrackParcel,
}) {
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadGreetingName = async () => {
      try {
        const profile = await getUserProfile();
        if (isActive && profile?.fullName) {
          const firstName = String(profile.fullName).trim().split(/\s+/)[0];
          setSavedName(firstName);
        }
      } catch (error) {
        console.error("Welcome screen profile load error:", error);
      }
    };

    loadGreetingName();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={COLORS.background}
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* TOP BRAND / LOGO */}
        <View style={styles.brandHeader}>
          <Image
            source={require("../../assets/svitsai-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* HERO WELCOME CARD */}
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>SVITSAI LOGISTICS</Text>

          <Text style={styles.heroTitle}>
            {savedName
              ? `Welcome back, ${savedName} 👋`
              : "Send parcels across towns with confidence."}
          </Text>

          <Text style={styles.heroSubtitle}>
            Register shipments, choose preferred collection depots, track
            every handover, and stay updated from dispatch to pickup.
          </Text>

          <Pressable
            style={styles.primaryCta}
            onPress={onEnterHome}
          >
            <Text style={styles.primaryCtaText}>
              Get Started →
            </Text>
          </Pressable>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Pressable
          style={styles.quickCard}
          onPress={onSendParcel || onEnterHome}
        >
          <View style={styles.iconBadge}>
            <Text style={styles.iconEmoji}>📦</Text>
          </View>
          <View style={styles.quickTextWrap}>
            <Text style={styles.quickTitle}>Send a Parcel</Text>
            <Text style={styles.quickDesc}>
              Start a 3-step parcel registration with your saved details.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          style={styles.quickCard}
          onPress={onTrackParcel || onEnterHome}
        >
          <View style={styles.iconBadge}>
            <Text style={styles.iconEmoji}>🔍</Text>
          </View>
          <View style={styles.quickTextWrap}>
            <Text style={styles.quickTitle}>Track a Parcel</Text>
            <Text style={styles.quickDesc}>
              Check live status from registered and in-transit to collected.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* HIGHLIGHTS */}
        <Text style={styles.sectionTitle}>Why Svitsai</Text>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureTitle}>Pickup Hubs</Text>
            <Text style={styles.featureText}>
              Select and save your preferred collection point.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureTitle}>Live Updates</Text>
            <Text style={styles.featureText}>
              Automatic alerts at every parcel milestone.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🚚</Text>
            <Text style={styles.featureTitle}>Partner Transit</Text>
            <Text style={styles.featureText}>
              Clear handover and transport tracking records.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureTitle}>Safe Collection</Text>
            <Text style={styles.featureText}>
              Six-digit code verification for recipient pickup.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Svitsai · Send with confidence.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoImage: {
    width: "100%",
    height: 130,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  eyebrow: {
    color: "#E8F3E4",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    lineHeight: 32,
  },
  heroSubtitle: {
    color: "#E8F3E4",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  primaryCta: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  primaryCtaText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  quickCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  quickTextWrap: {
    flex: 1,
  },
  quickTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "bold",
  },
  quickDesc: {
    color: "#666666",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  chevron: {
    color: COLORS.primary,
    fontSize: 26,
    marginLeft: 8,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 2,
  },
  featureCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  featureText: {
    color: "#666666",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  footer: {
    color: "#999999",
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
});