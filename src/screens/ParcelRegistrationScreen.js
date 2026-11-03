
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { COLORS } from "../theme/colors";

export default function ParcelRegistrationScreen({ onBack }) {
  const [step, setStep] = useState(1);

  // Sender information
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  // Recipient information
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Next-of-kin information
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // Move to the next step
  const handleContinue = () => {
    if (step === 1) {
      if (!senderName.trim() || !senderPhone.trim()) {
        Alert.alert(
          "Missing Information",
          "Please enter the sender's full name and phone number."
        );
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (
        !recipientName.trim() ||
        !recipientPhone.trim() ||
        !nextOfKinName.trim() ||
        !nextOfKinPhone.trim()
      ) {
        Alert.alert(
          "Missing Information",
          "Please complete all four fields: recipient name, recipient phone, next-of-kin name and next-of-kin phone."
        );
        return;
      }

      Alert.alert(
        "Information Saved!",
        "Sender, recipient and next-of-kin information have been entered successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              // Temporary confirmation for this prototype
              setStep(1);
            },
          },
        ]
      );
    }
  };

  // Reusable input field
  const renderInput = (
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default"
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >

          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                if (step === 2) {
                  setStep(1);
                } else if (onBack) {
                  onBack();
                }
              }}
            >
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>

            <Text style={styles.brandName}>Svitsai</Text>

            <View style={styles.headerSpace} />
          </View>

          {/* Introduction */}
          <View style={styles.introduction}>
            <Text style={styles.title}>Send a Parcel 📦</Text>

            <Text style={styles.subtitle}>
              Complete the information below to get your parcel ready
              for delivery.
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: step === 1 ? "50%" : "100%",
                  },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              STEP {step} OF 2
            </Text>
          </View>

          {/* STEP 1: SENDER */}
          {step === 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.stepNumber}>01</Text>

                <View>
                  <Text style={styles.sectionTitle}>
                    Sender Information
                  </Text>

                  <Text style={styles.sectionDescription}>
                    Who is sending this parcel?
                  </Text>
                </View>
              </View>

              {renderInput(
                "Sender Full Name",
                "Enter your full name",
                senderName,
                setSenderName
              )}

              {renderInput(
                "Sender Phone Number",
                "e.g. 0771234567",
                senderPhone,
                setSenderPhone,
                "phone-pad"
              )}
            </View>
          )}

          {/* STEP 2: RECIPIENT AND NEXT OF KIN */}
          {step === 2 && (
            <View style={styles.section}>

              {/* Recipient */}
              <View style={styles.sectionHeader}>
                <Text style={styles.stepNumber}>02</Text>

                <View>
                  <Text style={styles.sectionTitle}>
                    Recipient Information
                  </Text>

                  <Text style={styles.sectionDescription}>
                    Who will receive this parcel?
                  </Text>
                </View>
              </View>

              {renderInput(
                "Recipient Full Name",
                "Enter recipient's full name",
                recipientName,
                setRecipientName
              )}

              {renderInput(
                "Recipient Phone Number",
                "e.g. 0772345678",
                recipientPhone,
                setRecipientPhone,
                "phone-pad"
              )}

              <View style={styles.divider} />

              {/* Next of Kin */}
              <Text style={styles.kinTitle}>
                Next-of-Kin Information
              </Text>

              <Text style={styles.sectionDescription}>
                Provide an alternative contact person.
              </Text>

              {renderInput(
                "Next-of-Kin Full Name",
                "Enter next-of-kin full name",
                nextOfKinName,
                setNextOfKinName
              )}

              {renderInput(
                "Next-of-Kin Phone Number",
                "e.g. 0773456789",
                nextOfKinPhone,
                setNextOfKinPhone,
                "phone-pad"
              )}

            </View>
          )}

          {/* Continue Button */}
          <Pressable
            style={styles.button}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>
              {step === 1 ? "Continue →" : "Save & Continue →"}
            </Text>
          </Pressable>

          <Text style={styles.footerText}>
            Svitsai – Send with confidence.
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

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
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

  introduction: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 25,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    lineHeight: 21,
  },

  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },

  progressTrack: {
    height: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },

  progressText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 9,
  },

  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  stepNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: COLORS.accent,
    marginRight: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },

  sectionDescription: {
    color: "#777777",
    fontSize: 13,
    marginTop: 5,
    marginBottom: 18,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 9,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 11,
    padding: 15,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginVertical: 22,
  },

  kinTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 5,
  },

  button: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  footerText: {
    color: "#888888",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 15,
  },
});
