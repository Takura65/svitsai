
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { COLORS } from "../theme/colors";
import { getParcels } from "../services/parcelStorage";

export default function StaffDashboardScreen({
  onBack,
  onManageParcels,
  onOpenCollection,
  onOpenHandover,
  onOpenTransportTracking,
}) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getParcels();
      setParcels(data);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const countStatus = (status) =>
    parcels.filter((parcel) => parcel.status === status).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.brand}>Svitsai</Text>

        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>STAFF PORTAL</Text>

        <Text style={styles.title}>Staff Dashboard</Text>

        <Text style={styles.subtitle}>
          Manage parcel operations and keep deliveries moving.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : (
          <>
            {/* PARCEL SUMMARY */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                TOTAL REGISTERED PARCELS
              </Text>

              <Text style={styles.summaryNumber}>
                {parcels.length}
              </Text>

              <Text style={styles.summaryHint}>
                Parcels saved on this device
              </Text>
            </View>

            {/* PARCEL OVERVIEW */}
            <Text style={styles.sectionTitle}>
              Parcel Overview
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {countStatus("Registered")}
                </Text>
                <Text style={styles.statLabel}>Registered</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {countStatus("Awaiting Collection")}
                </Text>
                <Text style={styles.statLabel}>
                  Awaiting Collection
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {countStatus("In Transit")}
                </Text>
                <Text style={styles.statLabel}>In Transit</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {countStatus("Ready for Collection")}
                </Text>
                <Text style={styles.statLabel}>
                  Ready for Collection
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {countStatus("Collected")}
                </Text>
                <Text style={styles.statLabel}>Collected</Text>
              </View>
            </View>

            {/* STAFF OPERATIONS */}
            <Text style={styles.sectionTitle}>
              Staff Operations
            </Text>

            {/* MANAGE PARCEL STATUS */}
            <Pressable
              style={styles.actionCard}
              onPress={onManageParcels}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.iconText}>↗</Text>
              </View>

              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>
                  Manage Parcel Status
                </Text>

                <Text style={styles.actionDescription}>
                  Search parcels, update delivery progress and add
                  tracking notes.
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>

            {/* VERIFY PARCEL COLLECTION */}
            <Pressable
              style={styles.actionCard}
              onPress={onOpenCollection}
            >
              <View style={styles.collectionIcon}>
                <Text style={styles.collectionIconText}>✓</Text>
              </View>

              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>
                  Verify Parcel Collection
                </Text>

                <Text style={styles.actionDescription}>
                  Enter and verify the recipient's six-digit
                  collection code.
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>

            {/* TRANSPORT HANDOVER */}
<Pressable
  style={styles.actionCard}
  onPress={onOpenHandover}
>
  <View style={styles.actionIcon}>
    <Text style={styles.iconText}></Text>
  </View>

  <View style={styles.actionTextContainer}>
    <Text style={styles.actionTitle}>
      Transport Handover
    </Text>

    <Text style={styles.actionDescription}>
      Record parcels handed over to transport partners.
    </Text>
  </View>

  <Text style={styles.arrow}>›</Text>
</Pressable>

{/* TRANSPORT TRACKING */}
<Pressable
  style={styles.actionCard}
  onPress={onOpenTransportTracking}
>
  <View style={styles.actionIcon}>
    <Text style={styles.iconText}>🚚</Text>
  </View>

  <View style={styles.actionTextContainer}>
    <Text style={styles.actionTitle}>
      Transport Tracking
    </Text>

    <Text style={styles.actionDescription}>
      Monitor parcels currently handled by transport partners.
    </Text>
  </View>

  <Text style={styles.arrow}>›</Text>
</Pressable>

            {/* REFRESH */}
            <Pressable
              style={styles.refreshButton}
              onPress={loadDashboard}
            >
              <Text style={styles.refreshText}>
                ↻ Refresh Dashboard
              </Text>
            </Pressable>
          </>
        )}

        <Text style={styles.footer}>
          Svitsai Staff Portal · Send with confidence.
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  backButton: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },

  brand: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: "bold",
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#777",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },

  loader: {
    marginTop: 40,
  },

  summaryCard: {
    backgroundColor: COLORS.primary,
    padding: 22,
    borderRadius: 18,
    marginBottom: 25,
  },

  summaryLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 8,
  },

  summaryHint: {
    color: "#E5EEE4",
    fontSize: 12,
    marginTop: 3,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  statNumber: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: "bold",
  },

  statLabel: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },

  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 12,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "bold",
  },

  collectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  collectionIconText: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: "bold",
  },

  actionTextContainer: {
    flex: 1,
  },

  actionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },

  actionDescription: {
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  arrow: {
    color: COLORS.primary,
    fontSize: 28,
    marginLeft: 8,
  },

  refreshButton: {
    alignItems: "center",
    padding: 16,
    marginTop: 8,
  },

  refreshText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  footer: {
    color: "#999",
    textAlign: "center",
    fontSize: 11,
    marginTop: 25,
  },
});
