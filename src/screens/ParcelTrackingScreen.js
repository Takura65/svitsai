
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";

import { COLORS } from "../theme/colors";

import {
  getParcelById,
  PARCEL_STATUSES,
} from "../services/parcelStorage";

export default function ParcelTrackingScreen({ onBack }) {
  const [reference, setReference] = useState("");
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search for a parcel using its reference number
  const searchParcel = async () => {
    const searchReference = reference.trim().toUpperCase();

    if (!searchReference) {
      setError("Enter your parcel reference number.");
      setParcel(null);
      return;
    }

    Keyboard.dismiss();

    try {
      setLoading(true);
      setError("");
      setParcel(null);

      const found = await getParcelById(searchReference);

      if (!found) {
        setError("Parcel not found. Check your reference number.");
        return;
      }

      setParcel(found);
    } catch (err) {
      console.error("Tracking error:", err);
      setError("Unable to track parcel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format tracking dates
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const history = parcel?.statusHistory || [];

  const currentStatusIndex = PARCEL_STATUSES.indexOf(
    parcel?.status
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.brand}>Svitsai</Text>

        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Track Your Parcel</Text>

        <Text style={styles.subtitle}>
          Enter your Svitsai parcel reference to check its progress.
        </Text>

        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.label}>
            Parcel Reference Number
          </Text>

          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={setReference}
            placeholder="e.g. SVT-123456789"
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={searchParcel}
          />

          <Pressable
            style={styles.button}
            onPress={searchParcel}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Searching..." : "Track Parcel"}
            </Text>
          </Pressable>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        )}

        {/* Error Message */}
        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Parcel Details */}
        {parcel && (
          <>
            <View style={styles.parcelCard}>
              <Text style={styles.referenceLabel}>
                PARCEL REFERENCE
              </Text>

              <Text style={styles.reference}>
                {parcel.id}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {parcel.status}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.detailLabel}>
                Recipient
              </Text>

              <Text style={styles.detailValue}>
                {parcel.recipient?.fullName || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>
                Destination
              </Text>

              <Text style={styles.detailValue}>
                {parcel.destination?.town || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>
                Collection Point
              </Text>

              <Text style={styles.detailValue}>
                {parcel.destination?.collectionPoint ||
                  "Not provided"}
              </Text>
            </View>

            {/* Tracking History */}
            <Text style={styles.historyTitle}>
              Tracking History
            </Text>

            {history.length === 0 ? (
              <Text style={styles.emptyText}>
                No tracking updates available.
              </Text>
            ) : (
              history.slice().reverse().map((item, index) => (
                <View
                  key={`${item.timestamp}-${index}`}
                  style={styles.historyItem}
                >
                  <View style={styles.timelineColumn}>
                    <View style={styles.timelineDot} />

                    {index !== history.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>

                  <View style={styles.historyContent}>
                    <Text style={styles.historyStatus}>
                      {item.status}
                    </Text>

                    <Text style={styles.historyDate}>
                      {formatDate(item.timestamp)}
                    </Text>

                    {!!item.note && (
                      <Text style={styles.historyNote}>
                        {item.note}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <Text style={styles.footer}>
          Svitsai – Send with confidence.
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
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  brand: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 21,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: COLORS.text,
  },

  subtitle: {
    color: "#666666",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },

  searchCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },

  label: {
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
  },

  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  errorCard: {
    backgroundColor: "#FCE8E8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  errorText: {
    color: "#A93226",
  },

  parcelCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
  },

  referenceLabel: {
    color: "#777777",
    fontSize: 11,
    fontWeight: "bold",
  },

  reference: {
    fontSize: 19,
    color: COLORS.primary,
    fontWeight: "bold",
    marginTop: 6,
  },

  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 12,
  },

  statusText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 18,
  },

  detailLabel: {
    color: "#777777",
    fontSize: 12,
    marginTop: 12,
  },

  detailValue: {
    color: COLORS.text,
    fontWeight: "600",
    marginTop: 4,
  },

  historyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },

  historyItem: {
    flexDirection: "row",
    minHeight: 75,
  },

  timelineColumn: {
    width: 25,
    alignItems: "center",
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.accent,
  },

  historyContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },

  historyStatus: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
  },

  historyDate: {
    fontSize: 12,
    color: "#777777",
    marginTop: 5,
  },

  historyNote: {
    fontSize: 12,
    color: "#666666",
    marginTop: 5,
  },

  emptyText: {
    color: "#777777",
  },

  footer: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 30,
  },
});
