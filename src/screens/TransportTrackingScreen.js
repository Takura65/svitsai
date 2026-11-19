
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

export default function TransportTrackingScreen({ onBack }) {
  const [reference, setReference] = useState("");
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // SEARCH PARCEL
  const searchParcel = async () => {
    if (!reference.trim()) {
      setError("Enter a parcel reference number.");
      setParcel(null);
      return;
    }

    try {
      Keyboard.dismiss();
      setLoading(true);
      setError("");
      setParcel(null);

      const found = await getParcelById(reference);

      if (!found) {
        setError("Parcel not found. Check the reference number.");
        return;
      }

      setParcel(found);
    } catch (err) {
      console.error("Transport tracking error:", err);
      setError("Unable to retrieve parcel information.");
    } finally {
      setLoading(false);
    }
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "Not recorded";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const currentIndex = parcel
    ? PARCEL_STATUSES.indexOf(parcel.status)
    : -1;

  const handoverHistory = parcel?.handoverHistory || [];

  const currentHandover = parcel?.transportHandover;

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.brand}>Svitsai</Text>

        <View style={{ width: 45 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        <Text style={styles.eyebrow}>
          STAFF OPERATIONS
        </Text>

        <Text style={styles.title}>
          Transport Tracking
        </Text>

        <Text style={styles.subtitle}>
          Monitor parcel movements and transport partner information.
        </Text>

        {/* SEARCH */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Parcel Reference Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. SVT-123456789"
            value={reference}
            onChangeText={setReference}
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
              {loading ? "Searching..." : "Track Transport"}
            </Text>
          </Pressable>
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        )}

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        {parcel && (
          <>

            {/* PARCEL INFORMATION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Parcel Information
              </Text>

              <Text style={styles.detailLabel}>
                Reference Number
              </Text>

              <Text style={styles.reference}>
                {parcel.id}
              </Text>

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
                {parcel.destination?.collectionPoint || "Not provided"}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {parcel.status}
                </Text>
              </View>
            </View>

            {/* TRANSPORT INFORMATION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Transport Partner
              </Text>

              {currentHandover ? (
                <>
                  <Text style={styles.detailLabel}>
                    Transport Company
                  </Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.partner || "Not recorded"}
                  </Text>

                  <Text style={styles.detailLabel}>
                    Contact Person
                  </Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.contactPerson || "Not recorded"}
                  </Text>

                  <Text style={styles.detailLabel}>
                    Contact Number
                  </Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.contactNumber || "Not provided"}
                  </Text>

                  <Text style={styles.detailLabel}>
                    Vehicle Details
                  </Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.vehicleDetails || "Not provided"}
                  </Text>

                  <Text style={styles.detailLabel}>
                    Handover Date
                  </Text>

                  <Text style={styles.detailValue}>
                    {formatDate(currentHandover.handedOverAt)}
                  </Text>

                  <Text style={styles.detailLabel}>
                    Handover Notes
                  </Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.notes || "No additional notes"}
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  No transport handover has been recorded for this parcel yet.
                </Text>
              )}
            </View>

            {/* DELIVERY JOURNEY */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Delivery Journey
              </Text>

              {PARCEL_STATUSES.map((status, index) => {
                const completed = index <= currentIndex;
                const active = index === currentIndex;

                return (
                  <View
                    key={status}
                    style={styles.timelineItem}
                  >
                    <View style={styles.timelineColumn}>
                      <View
                        style={[
                          styles.timelineDot,
                          completed && styles.completedDot,
                          active && styles.activeDot,
                        ]}
                      />

                      {index !== PARCEL_STATUSES.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            index < currentIndex &&
                              styles.completedLine,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineStatus,
                          completed && styles.completedText,
                        ]}
                      >
                        {status}
                      </Text>

                      {active && (
                        <Text style={styles.currentLabel}>
                          CURRENT STATUS
                        </Text>
                      )}

                      {index === 0 && (
                        <Text style={styles.timelineDescription}>
                          Parcel registration completed.
                        </Text>
                      )}

                      {index === 2 && (
                        <Text style={styles.timelineDescription}>
                          Parcel is with the transport partner.
                        </Text>
                      )}

                      {index === 3 && (
                        <Text style={styles.timelineDescription}>
                          Parcel has arrived at its collection point.
                        </Text>
                      )}

                      {index === 4 && (
                        <Text style={styles.timelineDescription}>
                          Recipient has successfully collected the parcel.
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* HANDOVER HISTORY */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Transport Handover History
              </Text>

              {handoverHistory.length > 0 ? (
                handoverHistory.slice().reverse().map(
                  (handover, index) => (
                    <View
                      key={handover.id || index}
                      style={styles.handoverItem}
                    >
                      <Text style={styles.historyHeading}>
                        Handover {handoverHistory.length - index}
                      </Text>

                      <Text style={styles.detailLabel}>
                        Transport Partner
                      </Text>

                      <Text style={styles.detailValue}>
                        {handover.partner}
                      </Text>

                      <Text style={styles.detailLabel}>
                        Contact Person
                      </Text>

                      <Text style={styles.detailValue}>
                        {handover.contactPerson}
                      </Text>

                      <Text style={styles.detailLabel}>
                        Handover Date
                      </Text>

                      <Text style={styles.detailValue}>
                        {formatDate(handover.handedOverAt)}
                      </Text>

                      {index !== handoverHistory.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  )
                )
              ) : (
                <Text style={styles.emptyText}>
                  No handover history available.
                </Text>
              )}
            </View>

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
    paddingBottom: 40,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },

  title: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "bold",
    marginTop: 8,
  },

  subtitle: {
    color: "#666666",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 18,
  },

  label: {
    color: COLORS.text,
    fontWeight: "600",
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
    marginTop: 15,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  loader: {
    marginVertical: 15,
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

  reference: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: "bold",
  },

  detailLabel: {
    color: "#777777",
    fontSize: 12,
    marginTop: 13,
  },

  detailValue: {
    color: COLORS.text,
    fontWeight: "600",
    marginTop: 5,
  },

  statusBadge: {
    backgroundColor: COLORS.surface,
    alignSelf: "flex-start",
    padding: 10,
    borderRadius: 20,
    marginTop: 18,
  },

  statusText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 85,
  },

  timelineColumn: {
    width: 25,
    alignItems: "center",
  },

  timelineDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#B8C8B2",
    backgroundColor: "#FFFFFF",
  },

  completedDot: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.primary,
  },

  activeDot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#D8DFD5",
  },

  completedLine: {
    backgroundColor: COLORS.primary,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },

  timelineStatus: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "600",
  },

  completedText: {
    color: COLORS.primary,
  },

  currentLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 5,
  },

  timelineDescription: {
    color: "#777777",
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  historyHeading: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "bold",
  },

  handoverItem: {
    marginBottom: 15,
  },

  divider: {
    height: 1,
    backgroundColor: "#D8DFD5",
    marginVertical: 20,
  },

  emptyText: {
    color: "#777777",
    lineHeight: 20,
  },

  footer: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
});
