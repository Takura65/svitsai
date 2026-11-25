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
} from "react-native";

import { COLORS } from "../theme/colors";
import { getUserProfile, saveUserProfile } from "../services/userProfileStorage";
import { getParcels } from "../services/parcelStorage";
import {
  getCollectionLocations,
  getSelectedLocationId,
} from "../services/collectionLocationStorage";

export default function UserProfileScreen({ onBack, onSignOut }) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");

  const [parcelCount, setParcelCount] = useState(0);
  const [preferredDepotName, setPreferredDepotName] = useState("Not set");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const [profile, parcels, locations, selectedLocId] = await Promise.all([
        getUserProfile(),
        getParcels().catch(() => []),
        getCollectionLocations().catch(() => []),
        getSelectedLocationId().catch(() => ""),
      ]);

      setFullName(profile.fullName || "");
      setPhoneNumber(profile.phoneNumber || "");
      setEmail(profile.email || "");
      setCity(profile.city || "");
      setDefaultAddress(profile.defaultAddress || "");

      setParcelCount(Array.isArray(parcels) ? parcels.length : 0);

      const activeDepot = Array.isArray(locations)
        ? locations.find((loc) => loc.id === selectedLocId) || locations[0]
        : null;
      setPreferredDepotName(activeDepot?.name || "Not set");
    } catch (error) {
      console.error("Profile screen load error:", error);
      Alert.alert("Loading Failed", "Unable to load your profile details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert(
        "Missing Details",
        "Please enter at least your full name and phone number."
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setSaving(true);

      const saved = await saveUserProfile({
        fullName,
        phoneNumber,
        email,
        city,
        defaultAddress,
      });

      setFullName(saved.fullName);
      setPhoneNumber(saved.phoneNumber);
      setEmail(saved.email);
      setCity(saved.city);
      setDefaultAddress(saved.defaultAddress);

      Alert.alert("Profile Saved", "Your Svitsai profile has been updated.");
    } catch (error) {
      Alert.alert("Save Failed", error.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName.trim()
    ? fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("")
    : "SV";

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
        <Text style={styles.eyebrow}>ACCOUNT & PREFERENCES</Text>
        <Text style={styles.title}>User Profile</Text>
        <Text style={styles.subtitle}>
          Manage your sender contact details and view your saved preferences.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 30 }}
          />
        ) : (
          <>
            {/* PROFILE SUMMARY CARD */}
            <View style={styles.summaryCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.summaryInfo}>
                <Text style={styles.summaryName}>
                  {fullName.trim() || "Svitsai Sender"}
                </Text>
                <Text style={styles.summaryMeta}>
                  {phoneNumber.trim() || "Add a phone number below"}
                </Text>
                <Text style={styles.summaryBadge}>
                  {parcelCount} parcel(s) · Preferred: {preferredDepotName}
                </Text>
              </View>
            </View>

            {/* EDITABLE PROFILE FORM */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Personal & Contact Info</Text>

              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Thabani Mlambo"
                placeholderTextColor="#999999"
                editable={!saving}
              />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="e.g. +263 77 123 4567"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                editable={!saving}
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. name@example.com"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />

              <Text style={styles.label}>City / Town</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Harare"
                placeholderTextColor="#999999"
                editable={!saving}
              />

              <Text style={styles.label}>Default Pickup / Drop-off Address</Text>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={defaultAddress}
                onChangeText={setDefaultAddress}
                placeholder="Optional street or suburb details"
                placeholderTextColor="#999999"
                multiline
                editable={!saving}
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabled]}
                activeOpacity={0.8}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {onSignOut ? (
          <TouchableOpacity
            style={styles.signOutButton}
            activeOpacity={0.8}
            onPress={onSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        ) : null}

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
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryMeta: {
    color: "#E8F3E4",
    fontSize: 13,
    marginTop: 3,
  },
  summaryBadge: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  label: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 10,
    padding: 13,
    color: COLORS.text,
    backgroundColor: "#FFFFFF",
  },
  addressInput: {
    height: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  disabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  signOutButton: {
    alignItems: "center",
    borderColor: "#D8DFD5",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  signOutText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#999999",
    fontSize: 12,
    marginTop: 24,
  },
});