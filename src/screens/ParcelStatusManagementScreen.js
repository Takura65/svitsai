
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
} from "react-native";

import { COLORS } from "../theme/colors";

import {
  getParcelById,
  updateParcelStatus,
  PARCEL_STATUSES,
} from "../services/parcelStorage";

export default function ParcelStatusManagementScreen({ onBack }) {
  const [reference, setReference] = useState("");
  const [parcel, setParcel] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // SEARCH PARCEL
  const searchParcel = async () => {
    const searchReference = reference.trim().toUpperCase();

    if (!searchReference) {
      setError("Enter a parcel reference number.");
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
        setError("Parcel not found. Check the reference number.");
        return;
      }

      setParcel(found);
      setSelectedStatus(found.status);
      setNote("");
    } catch (err) {
      console.error("Parcel search error:", err);
      setError("Unable to retrieve parcel information.");
    } finally {
      setLoading(false);
    }
  };

  // UPDATE PARCEL STATUS
  const handleStatusUpdate = async () => {
    if (!parcel) return;

    if (!selectedStatus) {
      Alert.alert("Select Status", "Choose a new parcel status.");
      return;
    }

    if (selectedStatus === parcel.status) {
      Alert.alert(
        "No Changes",
        "This parcel already has the selected status."
      );
      return;
    }

    try {
      setSaving(true);

      const updatedParcel = await updateParcelStatus(
        parcel.id,
        selectedStatus,
        note.trim() || "Parcel status updated by staff."
      );

      setParcel(updatedParcel);
      setNote("");

      Alert.alert(
        "Success",
        "Parcel status updated successfully."
      );
    } catch (err) {
      console.error("Status update error:", err);

      Alert.alert(
        "Update Failed",
        err.message || "Unable to update parcel status."
      );
    } finally {
      setSaving(false);
    }
  };

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

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>STAFF OPERATIONS</Text>

        <Text style={styles.title}>
          Parcel Management
        </Text>

        <Text style={styles.subtitle}>
          Search for parcels and update their delivery progress.
        </Text>

        {/* SEARCH */}
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
            style={styles.searchButton}
            onPress={searchParcel}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Searching..." : "Search Parcel"}
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

        {/* PARCEL DETAILS */}
        {parcel && (
          <>
            <View style={styles.parcelCard}>
              <Text style={styles.cardHeading}>
                Parcel Information
              </Text>

              <Text style={styles.referenceLabel}>
                PARCEL REFERENCE
              </Text>

              <Text style={styles.reference}>
                {parcel.id}
              </Text>

              <View style={styles.currentStatus}>
                <Text style={styles.currentStatusLabel}>
                  CURRENT STATUS
                </Text>

                <Text style={styles.currentStatusValue}>
                  {parcel.status}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.detailLabel}>Sender</Text>
              <Text style={styles.detailValue}>
                {parcel.sender?.fullName || "Not provided"}
              </Text>

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
            </View>

            {/* STATUS SELECTION */}
            <View style={styles.updateCard}>
              <Text style={styles.cardHeading}>
                Update Delivery Status
              </Text>

              <Text style={styles.label}>
                Select New Status
              </Text>

              {PARCEL_STATUSES.map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status &&
                      styles.selectedStatusOption,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <View style={styles.radioOuter}>
                    {selectedStatus === status && (
                      <View style={styles.radioInner} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.statusOptionText,
                      selectedStatus === status &&
                        styles.selectedStatusText,
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}

              <Text style={[styles.label, styles.noteLabel]}>
                Tracking Note
              </Text>

              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Enter a delivery update..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Pressable
                style={[
                  styles.updateButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleStatusUpdate}
                disabled={saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? "Saving Update..." : "Save Status Update"}
                </Text>
              </Pressable>
            </View>

            {/* TRACKING HISTORY */}
            <Text style={styles.historyTitle}>
              Status History
            </Text>

            {(parcel.statusHistory || [])
              .slice()
              .reverse()
              .map((item, index) => (
                <View
                  key={`${item.timestamp}-${index}`}
                  style={styles.historyItem}
                >
                  <View style={styles.timelineColumn}>
                    <View style={styles.timelineDot} />

                    {index !==
                      (parcel.statusHistory || []).length - 1 && (
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
              ))}
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
    paddingBottom: 35,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
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

  searchButton: {
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

  parcelCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  cardHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 18,
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

  currentStatus: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
  },

  currentStatusLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "bold",
  },

  currentStatusValue: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 5,
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

  updateCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
  },

  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    marginBottom: 9,
  },

  selectedStatusOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },

  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  statusOptionText: {
    color: COLORS.text,
    fontSize: 13,
  },

  selectedStatusText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  noteLabel: {
    marginTop: 15,
  },

  noteInput: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 10,
    padding: 14,
    height: 100,
    color: COLORS.text,
  },

  updateButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.6,
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

  footer: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 30,
  },
});
