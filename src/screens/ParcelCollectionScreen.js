
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
  verifyParcelCollection,
} from "../services/parcelStorage";

export default function ParcelCollectionScreen({ onBack }) {
  const [reference, setReference] = useState("");
  const [code, setCode] = useState("");
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const searchParcel = async () => {
    if (!reference.trim()) {
      Alert.alert("Missing Reference", "Enter the parcel reference number.");
      return;
    }

    try {
      Keyboard.dismiss();
      setLoading(true);
      setParcel(null);
      setCode("");

      const found = await getParcelById(
        reference.trim().toUpperCase()
      );

      if (!found) {
        Alert.alert("Not Found", "Parcel could not be found.");
        return;
      }

      // Searching only retrieves information.
      // It NEVER changes the parcel status.
      setParcel(found);
    } catch (error) {
      Alert.alert("Error", "Unable to retrieve parcel.");
    } finally {
      setLoading(false);
    }
  };

  const handleCollection = async () => {
    if (!parcel) return;

    if (parcel.status !== "Ready for Collection") {
      Alert.alert(
        "Not Ready",
        "Only parcels marked Ready for Collection can be collected."
      );
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      Alert.alert(
        "Invalid Code",
        "Enter the complete six-digit collection code."
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setVerifying(true);

      // This is the ONLY operation that confirms collection.
      const collectedParcel = await verifyParcelCollection(
        parcel.id,
        code
      );

      setParcel(collectedParcel);
      setCode("");

      Alert.alert(
        "Collection Successful!",
        `Parcel ${collectedParcel.id} has been successfully collected.`
      );
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        error.message || "Incorrect collection code."
      );
    } finally {
      setVerifying(false);
    }
  };

  const isReady = parcel?.status === "Ready for Collection";
  const isCollected = parcel?.status === "Collected";

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
        <Text style={styles.title}>Parcel Collection</Text>

        <Text style={styles.subtitle}>
          Verify the recipient's six-digit collection code
          before releasing a parcel.
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
            editable={!loading && !verifying}
          />

          <Pressable
            style={[styles.button, loading && styles.disabledButton]}
            onPress={searchParcel}
            disabled={loading || verifying}
          >
            <Text style={styles.buttonText}>
              {loading ? "Searching..." : "Find Parcel"}
            </Text>
          </Pressable>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={COLORS.primary} />
        )}

        {/* PARCEL INFORMATION */}
        {parcel && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Parcel Information</Text>

            <Text style={styles.detailLabel}>Reference Number</Text>
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
              <Text style={styles.statusText}>{parcel.status}</Text>
            </View>

            {/* REQUIRE CODE */}
            {isReady && (
              <View style={styles.verificationSection}>
                <Text style={styles.sectionTitle}>
                  Verify Collection Code
                </Text>

                <Text style={styles.instruction}>
                  Ask the recipient to provide their six-digit
                  collection code.
                </Text>

                <TextInput
                  style={styles.codeInput}
                  placeholder="000000"
                  value={code}
                  onChangeText={(value) =>
                    setCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  editable={!verifying}
                />

                <Text style={styles.codeCounter}>
                  {code.length}/6 digits entered
                </Text>

                <Pressable
                  style={[
                    styles.button,
                    (verifying || code.length !== 6) &&
                      styles.disabledButton,
                  ]}
                  onPress={handleCollection}
                  disabled={verifying || code.length !== 6}
                >
                  <Text style={styles.buttonText}>
                    {verifying
                      ? "Verifying..."
                      : "Verify & Confirm Collection"}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ALREADY COLLECTED */}
            {isCollected && (
              <View style={styles.successCard}>
                <Text style={styles.successIcon}>✓</Text>

                <Text style={styles.successTitle}>
                  Previously Collected
                </Text>

                <Text style={styles.successDescription}>
                  This parcel is already marked as collected.
                  No new collection has been performed during
                  this search.
                </Text>

                {parcel.collectedAt && (
                  <Text style={styles.collectionDate}>
                    Collection date:{" "}
                    {new Date(parcel.collectedAt).toLocaleString("en-GB")}
                  </Text>
                )}
              </View>
            )}

            {/* OTHER STATUSES */}
            {!isReady && !isCollected && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  This parcel is not ready for collection.
                  Its status must be updated to Ready for Collection
                  before the recipient's code can be verified.
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: 40,
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
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
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
    marginTop: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 12,
    color: "#777777",
    marginTop: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 18,
  },
  statusText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  verificationSection: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    marginTop: 22,
    paddingTop: 20,
  },
  instruction: {
    color: "#666666",
    lineHeight: 20,
    marginBottom: 15,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 27,
    fontWeight: "bold",
    letterSpacing: 10,
    color: COLORS.primary,
  },
  codeCounter: {
    color: "#777777",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  successCard: {
    backgroundColor: "#E5F3E2",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
  },
  successIcon: {
    fontSize: 35,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  successTitle: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  successDescription: {
    color: COLORS.text,
    fontSize: 13,
    marginTop: 7,
    textAlign: "center",
    lineHeight: 20,
  },
  collectionDate: {
    color: "#666666",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  warningCard: {
    backgroundColor: "#FFF3D9",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  warningText: {
    color: "#805A16",
    lineHeight: 20,
    fontSize: 13,
  },
  footer: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
});
