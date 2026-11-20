import React, { useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";

import { COLORS } from "../theme/colors";
import { saveUserProfile, markWelcomeSeen } from "../services/userProfileStorage";

export default function RegisterScreen({ onComplete, onBack, onSkip }) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const isValidPhone = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, "");
    return /^(07\d{8}|\+2637\d{8}|2637\d{8})$/.test(cleaned);
  };

  const handleRegister = async () => {
    if (isSaving) return;

    if (!fullName.trim() || !phoneNumber.trim()) {
      showMessage(
        "Missing Information",
        "Please enter your full name and Zimbabwean mobile number."
      );
      return;
    }

    if (!isValidPhone(phoneNumber)) {
      showMessage(
        "Invalid Phone Number",
        "Please enter a valid Zimbabwean mobile number, e.g. 0771234567."
      );
      return;
    }

    try {
      setIsSaving(true);

      await saveUserProfile({
        fullName,
        phoneNumber,
        email,
        city,
        defaultAddress,
      });

      await markWelcomeSeen();

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      showMessage(
        "Registration Failed",
        error?.message || "Could not create your Svitsai profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await markWelcomeSeen();
    if (onSkip) {
      onSkip();
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* HEADER */}
          <View style={styles.header}>
            {onBack ? (
              <Pressable onPress={onBack}>
                <Text style={styles.backButton}>← Back</Text>
              </Pressable>
            ) : (
              <View style={{ width: 45 }} />
            )}

            <Text style={styles.brandName}>Svitsai</Text>

            <Pressable onPress={handleSkip}>
              <Text style={styles.skipButton}>Skip</Text>
            </Pressable>
          </View>

          {/* LOGO & INTRO */}
          <View style={styles.introSection}>
            <Image
              source={require("../../assets/svitsai-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.eyebrow}>CREATE SENDER ACCOUNT</Text>
            <Text style={styles.title}>Register with Svitsai</Text>
            <Text style={styles.subtitle}>
              Save your contact details once to auto-fill parcel shipments and
              track deliveries faster.
            </Text>
          </View>

          {/* REGISTRATION FORM */}
          <View style={styles.card}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Thabani Mlambo"
              placeholderTextColor="#999999"
              autoCapitalize="words"
              editable={!isSaving}
            />

            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g. 0771234567"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              editable={!isSaving}
            />

            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. name@example.com"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSaving}
            />

            <Text style={styles.label}>City / Town</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Harare"
              placeholderTextColor="#999999"
              autoCapitalize="words"
              editable={!isSaving}
            />

            <Text style={styles.label}>Default Pickup / Drop-off Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={defaultAddress}
              onChangeText={setDefaultAddress}
              placeholder="Optional street or suburb details"
              placeholderTextColor="#999999"
              multiline
              editable={!isSaving}
            />

            <TouchableOpacity
              style={[styles.registerButton, isSaving && styles.disabled]}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>
                  Create Account & Continue →
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Svitsai · Send with confidence.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  brandName: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: "bold",
  },
  skipButton: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "600",
  },
  introSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: "100%",
    height: 95,
    marginBottom: 8,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  subtitle: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 11,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
  },
  disabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  footerText: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
});