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
  Alert,
  Keyboard,
  Platform,
} from "react-native";

import { COLORS } from "../theme/colors";

import {
  getParcelById,
  recordTransportUpdate,
  PARCEL_STATUSES,
} from "../services/parcelStorage";

export default function TransportTrackingScreen({ onBack }) {
  const [reference, setReference] = useState("");
  const [parcel, setParcel] = useState(null);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [error, setError] = useState("");

  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // SEARCH PARCEL
  const searchParcel = async () => {
    const searchReference = reference.trim().toUpperCase();

    if (!searchReference) {
      setError("Enter a parcel reference number.");
      setParcel(null);
      return;
    }

    try {
      Keyboard.dismiss();
      setLoading(true);
      setError("");
      setParcel(null);
      setLocation("");
      setNote("");

      const found = await getParcelById(searchReference);

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

  // RECORD TRANSIT CHECKPOINT
  const handleRecordCheckpoint = async () => {
    if (!parcel || savingUpdate) return;

    if (parcel.status !== "In Transit") {
      showMessage(
        "Not In Transit",
        "Transit checkpoints can only be recorded for parcels that are In Transit."
      );
      return;
    }

    if (!location.trim()) {
      showMessage(
        "Missing Location",
        "Enter the parcel's current location or checkpoint."
      );
      return;
    }

    if (!note.trim()) {
      showMessage(
        "Missing Update Note",
        "Enter a brief note describing this transit checkpoint."
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setSavingUpdate(true);

      const updatedParcel = await recordTransportUpdate(parcel.id, {
        location: location.trim(),
        note: note.trim(),
      });

      setParcel(updatedParcel);
      setLocation("");
      setNote("");

      showMessage(
        "Checkpoint Recorded",
        `Added transit update at ${location.trim()} for ${updatedParcel.id}.`
      );
    } catch (err) {
      console.error("Transit checkpoint error:", err);
      showMessage(
        "Update Failed",
        err.message || "Unable to record transit checkpoint."
      );
    } finally {
      setSavingUpdate(false);
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
  const transportUpdates = parcel?.transportUpdates || [];
  const currentHandover = parcel?.transportHandover;
  const isInTransit = parcel?.status === "In Transit";

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
        <Text style={styles.eyebrow}>STAFF OPERATIONS</Text>

        <Text style={styles.title}>Transport Tracking</Text>

        <Text style={styles.subtitle}>
          Monitor parcel movements, log transit checkpoints, and review transport partner details.
        </Text>

        {/* SEARCH */}
        <View style={styles.card}>
          <Text style={styles.label}>Parcel Reference Number</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. SVT-123456789"
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={searchParcel}
            editable={!loading && !savingUpdate}
          />

          <Pressable
            style={[
              styles.button,
              (loading || savingUpdate) && styles.disabledButton,
            ]}
            onPress={searchParcel}
            disabled={loading || savingUpdate}
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
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {parcel && (
          <>
            {/* PARCEL INFORMATION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Parcel Information</Text>

              <Text style={styles.detailLabel}>Reference Number</Text>

              <Text style={styles.reference}>{parcel.id}</Text>

              <Text style={styles.detailLabel}>Recipient</Text>

              <Text style={styles.detailValue}>
                {parcel.recipient?.fullName || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>Destination</Text>

              <Text style={styles.detailValue}>
                {parcel.destination?.town || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>Collection Point</Text>

              <Text style={styles.detailValue}>
                {parcel.destination?.collectionPoint || "Not provided"}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{parcel.status}</Text>
              </View>
            </View>

            {/* RECORD TRANSIT CHECKPOINT */}
            {isInTransit && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Record Transit Checkpoint
                </Text>

                <Text style={styles.helperText}>
                  Log a location checkpoint while this parcel is actively with the transport partner.
                </Text>

                <Text style={styles.label}>Current Location / Checkpoint *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kwekwe Highway Checkpoint"
                  value={location}
                  onChangeText={setLocation}
                  editable={!savingUpdate}
                />

                <Text style={[styles.label, { marginTop: 14 }]}>
                  Transit Update Note *
                </Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="e.g. Vehicle passed checkpoint on schedule"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                  editable={!savingUpdate}
                />

                <Pressable
                  style={[
                    styles.button,
                    savingUpdate && styles.disabledButton,
                  ]}
                  onPress={handleRecordCheckpoint}
                  disabled={savingUpdate}
                >
                  {savingUpdate ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Save Transit Checkpoint
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* SAVED TRANSIT CHECKPOINTS */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Transit Checkpoints</Text>

              {transportUpdates.length > 0 ? (
                transportUpdates
                  .slice()
                  .reverse()
                  .map((checkpoint, index) => (
                    <View
                      key={checkpoint.id || `${checkpoint.updatedAt}-${index}`}
                      style={styles.checkpointItem}
                    >
                      <Text style={styles.checkpointLocation}>
                        📍 {checkpoint.location}
                      </Text>

                      <Text style={styles.checkpointDate}>
                        {formatDate(checkpoint.updatedAt)}
                      </Text>

                      {!!checkpoint.note && (
                        <Text style={styles.checkpointNote}>
                          {checkpoint.note}
                        </Text>
                      )}

                      {index !== transportUpdates.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  ))
              ) : (
                <Text style={styles.emptyText}>
                  No transit checkpoints recorded yet.
                </Text>
              )}
            </View>

            {/* TRANSPORT INFORMATION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Transport Partner</Text>

              {currentHandover ? (
                <>
                  <Text style={styles.detailLabel}>Transport Company</Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.partner || "Not recorded"}
                  </Text>

                  <Text style={styles.detailLabel}>Contact Person</Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.contactPerson || "Not recorded"}
                  </Text>

                  <Text style={styles.detailLabel}>Contact Number</Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.contactNumber || "Not provided"}
                  </Text>

                  <Text style={styles.detailLabel}>Vehicle Details</Text>

                  <Text style={styles.detailValue}>
                    {currentHandover.vehicleDetails || "Not provided"}
                  </Text>

                  <Text style={styles.detailLabel}>Handover Date</Text>

                  <Text style={styles.detailValue}>
                    {formatDate(currentHandover.handedOverAt)}
                  </Text>

                  <Text style={styles.detailLabel}>Handover Notes</Text>

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
              <Text style={styles.sectionTitle}>Delivery Journey</Text>

              {PARCEL_STATUSES.map((status, index) => {
                const completed = index <= currentIndex;
                const active = index === currentIndex;

                return (
                  <View key={status} style={styles.timelineItem}>
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

                      {index === 1 && (
                        <Text style={styles.timelineDescription}>
                          Parcel is prepared and awaiting transport handover.
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
                handoverHistory
                  .slice()
                  .reverse()
                  .map((handover, index) => (
                    <View
                      key={handover.id || index}
                      style={styles.handoverItem}
                    >
                      <Text style={styles.historyHeading}>
                        Handover {handoverHistory.length - index}
                      </Text>

                      <Text style={styles.detailLabel}>Transport Partner</Text>

                      <Text style={styles.detailValue}>
                        {handover.partner}
                      </Text>

                      <Text style={styles.detailLabel}>Contact Person</Text>

                      <Text style={styles.detailValue}>
                        {handover.contactPerson}
                      </Text>

                      <Text style={styles.detailLabel}>Handover Date</Text>

                      <Text style={styles.detailValue}>
                        {formatDate(handover.handedOverAt)}
                      </Text>

                      {index !== handoverHistory.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  ))
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
    marginBottom: 14,
  },

  helperText: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
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

  notesInput: {
    height: 90,
  },

  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },

  disabledButton: {
    opacity: 0.5,
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

  checkpointItem: {
    paddingVertical: 2,
  },

  checkpointLocation: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },

  checkpointDate: {
    color: "#777777",
    fontSize: 12,
    marginTop: 4,
  },

  checkpointNote: {
    color: "#666666",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
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