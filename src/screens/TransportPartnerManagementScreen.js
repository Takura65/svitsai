import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from "react-native";

import { COLORS } from "../theme/colors";
import {
  getTransportPartners,
  addTransportPartner,
  updateTransportPartner,
  deleteTransportPartner,
} from "../services/transportPartnerStorage";

export default function TransportPartnerManagementScreen({ onBack }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // LOAD PARTNERS FROM ASYNC STORAGE
  const loadPartners = useCallback(async (showMessage = false) => {
    try {
      setLoading(true);

      const data = await getTransportPartners();
      const safeData = Array.isArray(data) ? data : [];

      setPartners(safeData);

      if (showMessage) {
        Alert.alert(
          "Refresh Successful",
          `${safeData.length} transport partner(s) loaded.`
        );
      }
    } catch (error) {
      console.error("Load partners error:", error);

      Alert.alert(
        "Loading Failed",
        error.message || "Unable to load transport partners."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // LOAD WHEN SCREEN OPENS
  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // CLEAR FORM
  const resetForm = () => {
    setEditingId(null);
    setCompanyName("");
    setContactPerson("");
    setContactNumber("");
    setEmail("");
    setVehicleDetails("");
    setVehicleRegistration("");
    setAddress("");
    setNotes("");
  };

  // SAVE OR UPDATE PARTNER
  const handleSave = async () => {
    if (
      !companyName.trim() ||
      !contactPerson.trim() ||
      !contactNumber.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Company name, contact person and contact number are required."
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setSaving(true);

      const partnerData = {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        vehicleDetails: vehicleDetails.trim(),
        vehicleRegistration: vehicleRegistration.trim(),
        address: address.trim(),
        notes: notes.trim(),
      };

      if (editingId) {
        await updateTransportPartner(editingId, partnerData);

        Alert.alert(
          "Success",
          "Transport partner updated successfully."
        );
      } else {
        await addTransportPartner(partnerData);

        Alert.alert(
          "Success",
          "Transport partner added successfully."
        );
      }

      resetForm();
      await loadPartners();
    } catch (error) {
      console.error("Save partner error:", error);

      Alert.alert(
        "Unable to Save",
        error.message || "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  // EDIT PARTNER
  const handleEdit = (partner) => {
    setEditingId(partner.id);
    setCompanyName(partner.companyName || "");
    setContactPerson(partner.contactPerson || "");
    setContactNumber(partner.contactNumber || "");
    setEmail(partner.email || "");
    setVehicleDetails(partner.vehicleDetails || "");
    setVehicleRegistration(partner.vehicleRegistration || "");
    setAddress(partner.address || "");
    setNotes(partner.notes || "");

    Alert.alert(
      "Edit Mode",
      "Update the details and select Save Changes."
    );
  };

  // EXECUTE DELETE AFTER CONFIRMATION
  const performDelete = async (partner) => {
    try {
      setDeletingId(partner.id);

      const updatedPartners = await deleteTransportPartner(partner.id);

      setPartners(
        Array.isArray(updatedPartners) ? updatedPartners : []
      );

      if (editingId === partner.id) {
        resetForm();
      }

      Alert.alert(
        "Deleted Successfully",
        `${partner.companyName} has been removed.`
      );
    } catch (error) {
      console.error("Delete partner error:", error);

      Alert.alert(
        "Delete Failed",
        error.message || "Unable to delete transport partner."
      );

      await loadPartners();
    } finally {
      setDeletingId(null);
    }
  };

  // DELETE PARTNER (WEB + NATIVE COMPATIBLE)
  const handleDelete = (partner) => {
    if (!partner?.id) {
      Alert.alert("Delete Error", "Missing partner ID.");
      return;
    }

    const message = `Are you sure you want to delete ${partner.companyName}?`;

    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined" && window.confirm(message);
      if (confirmed) {
        performDelete(partner);
      }
      return;
    }

    Alert.alert(
      "Delete Transport Partner",
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(partner),
        },
      ]
    );
  };

  // REUSABLE INPUT
  const renderInput = (
    label,
    value,
    setter,
    placeholder,
    keyboardType = "default"
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        keyboardType={keyboardType}
        editable={!saving}
        autoCorrect={keyboardType === "default"}
        autoCapitalize={
          keyboardType === "email-address" ? "none" : "sentences"
        }
      />
    </>
  );

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

        <Text style={styles.title}>Transport Partners</Text>

        <Text style={styles.subtitle}>
          Register and manage transport companies and their vehicle
          information.
        </Text>

        {/* ADD / EDIT FORM */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingId ? "Edit Transport Partner" : "Add Transport Partner"}
          </Text>

          {renderInput(
            "Company Name *",
            companyName,
            setCompanyName,
            "e.g. ABC Transport"
          )}

          {renderInput(
            "Contact Person *",
            contactPerson,
            setContactPerson,
            "Full name"
          )}

          {renderInput(
            "Contact Number *",
            contactNumber,
            setContactNumber,
            "0771234567",
            "phone-pad"
          )}

          {renderInput(
            "Email Address",
            email,
            setEmail,
            "company@example.com",
            "email-address"
          )}

          {renderInput(
            "Vehicle Details",
            vehicleDetails,
            setVehicleDetails,
            "e.g. Toyota Hiace"
          )}

          {renderInput(
            "Vehicle Registration",
            vehicleRegistration,
            setVehicleRegistration,
            "e.g. AAE 1234"
          )}

          {renderInput(
            "Company Address",
            address,
            setAddress,
            "Enter company address"
          )}

          <Text style={styles.label}>Additional Notes</Text>

          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor="#999999"
            multiline
            editable={!saving}
          />

          <Pressable
            style={[
              styles.button,
              saving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {editingId ? "Save Changes" : "Add Transport Partner"}
              </Text>
            )}
          </Pressable>

          {editingId && (
            <Pressable
              style={styles.cancelButton}
              onPress={resetForm}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel Editing</Text>
            </Pressable>
          )}
        </View>

        {/* REGISTERED PARTNERS */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            Registered Transport Partners
          </Text>

          <Text style={styles.count}>{partners.length}</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 25 }}
          />
        ) : partners.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🚚</Text>

            <Text style={styles.emptyTitle}>
              No Transport Partners Yet
            </Text>

            <Text style={styles.emptyText}>
              Add your first transport company using the form above.
            </Text>
          </View>
        ) : (
          partners.map((partner) => (
            <View key={partner.id} style={styles.partnerCard}>
              <View style={styles.partnerHeader}>
                <View style={styles.partnerIcon}>
                  <Text style={styles.partnerIconText}>🚚</Text>
                </View>

                <View style={styles.partnerHeading}>
                  <Text style={styles.partnerName}>
                    {partner.companyName}
                  </Text>

                  <Text style={styles.partnerId}>{partner.id}</Text>
                </View>
              </View>

              <Text style={styles.detailLabel}>Contact Person</Text>
              <Text style={styles.detailValue}>{partner.contactPerson}</Text>

              <Text style={styles.detailLabel}>Contact Number</Text>
              <Text style={styles.detailValue}>{partner.contactNumber}</Text>

              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>
                {partner.email || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>
                {partner.vehicleDetails || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>Registration</Text>
              <Text style={styles.detailValue}>
                {partner.vehicleRegistration || "Not provided"}
              </Text>

              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>
                {partner.address || "Not provided"}
              </Text>

              {!!partner.notes && (
                <>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{partner.notes}</Text>
                </>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => handleEdit(partner)}
                  disabled={!!deletingId || saving}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => handleDelete(partner)}
                  disabled={!!deletingId || saving}
                >
                  {deletingId === partner.id ? (
                    <ActivityIndicator color="#B83232" />
                  ) : (
                    <Text style={styles.deleteText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* REFRESH BUTTON */}
        <Pressable
          style={[
            styles.refreshButton,
            (loading || !!deletingId || saving) && styles.disabledButton,
          ]}
          onPress={() => loadPartners(true)}
          disabled={loading || !!deletingId || saving}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.refreshText}>↻ Refresh Partners</Text>
          )}
        </Pressable>

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
    fontSize: 15,
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
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },

  label: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 9,
    marginTop: 13,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 10,
    padding: 14,
    color: COLORS.text,
    backgroundColor: "#FFFFFF",
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
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  cancelButton: {
    alignItems: "center",
    padding: 13,
    marginTop: 8,
  },

  cancelText: {
    color: "#777777",
    fontWeight: "600",
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  count: {
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },

  emptyText: {
    color: "#777777",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 20,
  },

  partnerCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
  },

  partnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  partnerIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  partnerIconText: {
    fontSize: 23,
  },

  partnerHeading: {
    flex: 1,
  },

  partnerName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "bold",
  },

  partnerId: {
    color: "#888888",
    fontSize: 11,
    marginTop: 4,
  },

  detailLabel: {
    color: "#777777",
    fontSize: 12,
    marginTop: 10,
  },

  detailValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    zIndex: 2,
  },

  editButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  editText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#FDECEC",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteText: {
    color: "#B83232",
    fontWeight: "700",
    fontSize: 14,
  },

  refreshButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },

  refreshText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    textAlign: "center",
    color: "#999999",
    fontSize: 12,
    marginTop: 28,
  },
});