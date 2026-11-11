
import React, { useEffect, useState, useCallback } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import { COLORS } from "../theme/colors";
import {
  getParcels,
  deleteParcel,
} from "../services/parcelStorage";

export default function MyParcelsScreen({ onBack }) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Load saved parcels
  const loadParcels = useCallback(async () => {
    try {
      setLoading(true);

      const savedParcels = await getParcels();

      setParcels(
        Array.isArray(savedParcels) ? savedParcels : []
      );
    } catch (error) {
      console.error("Error loading parcels:", error);

      if (Platform.OS === "web") {
        window.alert("Unable to load your parcels. Please try again.");
      } else {
        Alert.alert(
          "Error",
          "Unable to load your parcels. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParcels();
  }, [loadParcels]);

  // Delete a parcel
  const confirmDelete = (parcel) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to delete parcel ${parcel.id}?`
      );

      if (confirmed) {
        handleDelete(parcel.id);
      }

      return;
    }

    Alert.alert(
      "Delete Parcel",
      `Are you sure you want to delete ${parcel.id}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(parcel.id),
        },
      ]
    );
  };

  const handleDelete = async (parcelId) => {
    try {
      setDeletingId(parcelId);

      await deleteParcel(parcelId);

      setParcels((previous) =>
        previous.filter((parcel) => parcel.id !== parcelId)
      );

      if (Platform.OS === "web") {
        window.alert("Parcel deleted successfully.");
      } else {
        Alert.alert(
          "Deleted",
          "Parcel registration deleted successfully."
        );
      }
    } catch (error) {
      console.error("Error deleting parcel:", error);

      if (Platform.OS === "web") {
        window.alert("Unable to delete parcel. Please try again.");
      } else {
        Alert.alert(
          "Error",
          "Unable to delete parcel. Please try again."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Format registration date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Parcel card
  const renderParcel = (parcel) => (
    <View key={parcel.id} style={styles.parcelCard}>
      <View style={styles.cardHeader}>
        <View style={styles.parcelIcon}>
          <Text style={styles.parcelEmoji}>📦</Text>
        </View>

        <View style={styles.referenceContainer}>
          <Text style={styles.referenceLabel}>
            PARCEL REFERENCE
          </Text>

          <Text style={styles.reference}>
            {parcel.id}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {parcel.status || "Registered"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Recipient</Text>

        <Text style={styles.detailValue}>
          {parcel.recipient?.fullName || "Not provided"}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Destination</Text>

        <Text style={styles.detailValue}>
          {parcel.destination?.town || "Not provided"}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Collection Point</Text>

        <Text style={styles.detailValue}>
          {parcel.destination?.collectionPoint || "Not provided"}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Description</Text>

        <Text style={styles.detailValue}>
          {parcel.parcel?.description || "Not provided"}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Quantity</Text>

        <Text style={styles.detailValue}>
          {parcel.parcel?.quantity ?? 0}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Estimated Value</Text>

        <Text style={styles.detailValue}>
          ${Number(
            parcel.parcel?.estimatedValueUSD ?? 0
          ).toFixed(2)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Registered</Text>

        <Text style={styles.detailValue}>
          {formatDate(parcel.createdAt)}
        </Text>
      </View>

      <View style={styles.divider} />

      <Pressable
        style={[
          styles.deleteButton,
          deletingId === parcel.id && styles.disabledButton,
        ]}
        onPress={() => confirmDelete(parcel)}
        disabled={deletingId === parcel.id}
      >
        <Text style={styles.deleteButtonText}>
          {deletingId === parcel.id
            ? "Deleting..."
            : "Delete Parcel"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.brandName}>Svitsai</Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRODUCTION */}
        <View style={styles.introduction}>
          <Text style={styles.title}>My Parcels</Text>

          <Text style={styles.subtitle}>
            Manage and view all your registered parcels.
          </Text>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>
              TOTAL REGISTERED PARCELS
            </Text>

            <Text style={styles.summaryNumber}>
              {parcels.length}
            </Text>

            <Text style={styles.summaryDescription}>
              Parcels saved on this device
            </Text>
          </View>

          <Text style={styles.summaryEmoji}>📦</Text>
        </View>

        {/* REFRESH */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Your Registrations
          </Text>

          <Pressable onPress={loadParcels}>
            <Text style={styles.refreshText}>↻ Refresh</Text>
          </Pressable>
        </View>

        {/* LOADING */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.emptyDescription}>
              Loading your parcels...
            </Text>
          </View>
        ) : parcels.length === 0 ? (
          /* EMPTY STATE */
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>

            <Text style={styles.emptyTitle}>
              No Parcels Yet
            </Text>

            <Text style={styles.emptyDescription}>
              You haven't registered any parcels yet.
              Start by sending your first parcel with Svitsai.
            </Text>

            <Pressable
              style={styles.button}
              onPress={onBack}
            >
              <Text style={styles.buttonText}>
                Back to Home
              </Text>
            </Pressable>
          </View>
        ) : (
          /* PARCEL LIST */
          parcels.map(renderParcel)
        )}

        <Text style={styles.footerText}>
          Svitsai – Send with confidence.
        </Text>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  backButton: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },

  brandName: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  headerSpace: {
    width: 45,
  },

  scrollContent: {
    paddingBottom: 35,
  },

  introduction: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 22,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 7,
    lineHeight: 21,
  },

  summaryCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  summaryLabel: {
    color: "#E5EEE4",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 8,
  },

  summaryDescription: {
    color: "#E5EEE4",
    fontSize: 12,
    marginTop: 4,
  },

  summaryEmoji: {
    fontSize: 43,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
  },

  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  refreshText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  parcelCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 18,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5EEE4",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  parcelIcon: {
    width: 43,
    height: 43,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  parcelEmoji: {
    fontSize: 23,
  },

  referenceContainer: {
    flex: 1,
  },

  referenceLabel: {
    color: "#888888",
    fontSize: 9,
    fontWeight: "bold",
  },

  reference: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 13,
    marginTop: 4,
  },

  statusBadge: {
    backgroundColor: "#E5EEE4",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 16,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 13,
  },

  detailLabel: {
    color: "#888888",
    fontSize: 12,
    flex: 1,
  },

  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#E5B5B5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#C0392B",
    fontSize: 13,
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.5,
  },

  centerContent: {
    alignItems: "center",
    padding: 35,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 18,
    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "bold",
  },

  emptyDescription: {
    color: "#777777",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
  },

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 11,
    marginTop: 22,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  footerText: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 25,
  },
});
