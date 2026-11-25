
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
  recordTransportHandover,
} from "../services/parcelStorage";

export default function ParcelHandoverScreen({ onBack }) {
  const [reference, setReference] = useState("");
  const [parcel, setParcel] = useState(null);

  const [partner, setPartner] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchParcel = async () => {
    if (!reference.trim()) {
      Alert.alert("Missing Reference", "Enter a parcel reference number.");
      return;
    }

    try {
      Keyboard.dismiss();
      setLoading(true);
      setParcel(null);

      const found = await getParcelById(reference);

      if (!found) {
        Alert.alert("Not Found", "Parcel could not be found.");
        return;
      }

      setParcel(found);
    } catch (error) {
      Alert.alert("Error", "Unable to retrieve parcel.");
    } finally {
      setLoading(false);
    }
  };

  const handleHandover = async () => {
    if (!parcel) return;

    if (!partner.trim() || !contactPerson.trim()) {
      Alert.alert(
        "Missing Information",
        "Enter the transport partner and contact person."
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setSaving(true);

      const updatedParcel = await recordTransportHandover(
        parcel.id,
        {
          partner,
          contactPerson,
          contactNumber,
          vehicleDetails,
          notes,
        }
      );

      setParcel(updatedParcel);

      Alert.alert(
        "Handover Successful",
        `Parcel ${updatedParcel.id} has been handed over to ${partner}. Its status is now In Transit.`
      );
    } catch (error) {
      Alert.alert(
        "Handover Failed",
        error.message || "Unable to record parcel handover."
      );
    } finally {
      setSaving(false);
    }
  };

  const alreadyInTransit = parcel?.status === "In Transit";

const needsHandoverDetails =
  parcel &&
  (
    parcel.status === "Awaiting Collection" ||
    (
      parcel.status === "In Transit" &&
      !parcel.transportHandover?.partner
    )
  );

  return (
    <SafeAreaView style={styles.container}>
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

        <Text style={styles.title}>Transport Handover</Text>

        <Text style={styles.subtitle}>
          Record when a parcel is handed over to a transport partner.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Parcel Reference Number</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. SVT-123456789"
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
          />

          <Pressable
            style={styles.button}
            onPress={searchParcel}
            disabled={loading || saving}
          >
            <Text style={styles.buttonText}>
              {loading ? "Searching..." : "Find Parcel"}
            </Text>
          </Pressable>
        </View>

        {loading && (
          <ActivityIndicator color={COLORS.primary} size="large" />
        )}

        {parcel && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Parcel Information</Text>

              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{parcel.id}</Text>

              <Text style={styles.detailLabel}>Recipient</Text>
              <Text style={styles.detailValue}>
                {parcel.recipient?.fullName || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>
                {parcel.destination?.town || "Not provided"}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {parcel.status}
                </Text>
              </View>
            </View>

            {needsHandoverDetails &&  (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Transport Partner Details
                </Text>

                <Text style={styles.label}>Transport Company *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Transport Partner Name"
                  value={partner}
                  onChangeText={setPartner}
                  editable={!saving}
                />

                <Text style={styles.label}>Contact Person *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  editable={!saving}
                />

                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0771234567"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                  editable={!saving}
                />

                <Text style={styles.label}>Vehicle Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle registration or description"
                  value={vehicleDetails}
                  onChangeText={setVehicleDetails}
                  editable={!saving}
                />

                <Text style={styles.label}>Additional Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Optional handover notes"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  editable={!saving}
                />

                <Pressable
                  style={styles.button}
                  onPress={handleHandover}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Record Handover
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {alreadyInTransit && (
              <View style={styles.successCard}>
                <Text style={styles.successTitle}>
                  ✓ Parcel In Transit
                </Text>

                <Text style={styles.detailLabel}>Transport Partner</Text>
                <Text style={styles.detailValue}>
                  {parcel.transportHandover?.partner || "Not recorded"}
                </Text>

                <Text style={styles.detailLabel}>Contact Person</Text>
                <Text style={styles.detailValue}>
                  {parcel.transportHandover?.contactPerson || "Not recorded"}
                </Text>

                <Text style={styles.detailLabel}>Handover Date</Text>
                <Text style={styles.detailValue}>
                  {parcel.transportHandover?.handedOverAt
                    ? new Date(
                        parcel.transportHandover.handedOverAt
                      ).toLocaleString("en-GB")
                    : "Not recorded"}
                </Text>
              </View>
            )}

            {parcel.status !== "Awaiting Collection" &&
              !alreadyInTransit && !needsHandoverDetails && (
                <View style={styles.warningCard}>
                  <Text style={styles.warningText}>
                    This parcel cannot be handed over at its current
                    status. Only parcels marked Awaiting Collection
                    can be handed over.
                  </Text>
                </View>
              )}
            
{/* HANDOVER HISTORY */}
{parcel.handoverHistory?.length > 0 && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>
      Handover History
    </Text>

    {parcel.handoverHistory.map((handover, index) => (
      <View key={handover.id || index}>
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
          Contact Number
        </Text>
        <Text style={styles.detailValue}>
          {handover.contactNumber || "Not provided"}
        </Text>

        <Text style={styles.detailLabel}>
          Vehicle Details
        </Text>
        <Text style={styles.detailValue}>
          {handover.vehicleDetails || "Not provided"}
        </Text>

        <Text style={styles.detailLabel}>
          Handover Date
        </Text>
        <Text style={styles.detailValue}>
          {new Date(handover.handedOverAt).toLocaleString("en-GB")}
        </Text>

        <Text style={styles.detailLabel}>
          Notes
        </Text>
        <Text style={styles.detailValue}>
          {handover.notes || "No additional notes"}
        </Text>

        {index < parcel.handoverHistory.length - 1 && (
          <View
            style={{
              height: 1,
              backgroundColor: "#D8DFD5",
              marginVertical: 20,
            }}
          />
        )}
      </View>
    ))}
  </View>
)}
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
    fontSize: 21,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  eyebrow: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 11,
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
    marginBottom: 9,
    marginTop: 12,
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
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  detailLabel: {
    color: "#777777",
    fontSize: 12,
    marginTop: 12,
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
  successCard: {
    backgroundColor: "#E5F3E2",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  successTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  warningCard: {
    backgroundColor: "#FFF3D9",
    padding: 18,
    borderRadius: 12,
  },
  warningText: {
    color: "#805A16",
    lineHeight: 21,
  },
  footer: {
    textAlign: "center",
    color: "#888888",
    fontSize: 12,
    marginTop: 20,
  },
});
