import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { COLORS } from "../theme/colors";
import { saveParcel } from "../services/parcelStorage";
import {
  getCollectionLocations,
  getSelectedLocationId,
} from "../services/collectionLocationStorage";
import { getUserProfile } from "../services/userProfileStorage";

const generateCollectionCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(Math.random() * chars.length);
    code += chars[index];
  }
  return `SVT-${code}`;
};

export default function ParcelRegistrationScreen({ onBack }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [preferredLocation, setPreferredLocation] = useState(null);

  // Sender information
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  // Recipient information
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [collectionPoint, setCollectionPoint] = useState("");

  // Next-of-kin information
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // Parcel information
  const [parcelDescription, setParcelDescription] = useState("");
  const [parcelQuantity, setParcelQuantity] = useState("1");
  const [parcelValue, setParcelValue] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadDefaults = async () => {
      try {
        const [locations, selectedId, profile] = await Promise.all([
          getCollectionLocations().catch(() => []),
          getSelectedLocationId().catch(() => ""),
          getUserProfile().catch(() => null),
        ]);

        if (!isActive) return;

        const safeList = Array.isArray(locations) ? locations : [];
        const matchedDepot =
          safeList.find((loc) => loc.id === selectedId) || safeList[0] || null;
        setPreferredLocation(matchedDepot);

        if (matchedDepot) {
          setCollectionPoint((prev) => prev || matchedDepot.name || "");
          if (matchedDepot.city) {
            setDestination((prev) => prev || matchedDepot.city);
          }
        }

        if (profile) {
          if (profile.fullName) {
            setSenderName((prev) => prev || profile.fullName);
          }
          if (profile.phoneNumber) {
            setSenderPhone((prev) => prev || profile.phoneNumber);
          }
        }
      } catch (error) {
        console.error("Error loading registration defaults:", error);
      }
    };

    loadDefaults();

    return () => {
      isActive = false;
    };
  }, []);

  // Display alerts on web and mobile
  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Zimbabwean mobile number validation
  const isValidPhone = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, "");

    return /^(07\d{8}|\+2637\d{8}|2637\d{8})$/.test(cleaned);
  };

  // Reset registration form
  const resetForm = () => {
    setStep(1);

    setSenderName("");
    setSenderPhone("");

    setRecipientName("");
    setRecipientPhone("");
    setDestination(preferredLocation?.city || "");
    setCollectionPoint(preferredLocation?.name || "");

    setNextOfKinName("");
    setNextOfKinPhone("");

    setParcelDescription("");
    setParcelQuantity("1");
    setParcelValue("");
  };

  const applyPreferredLocation = () => {
    if (!preferredLocation) return;
    setCollectionPoint(preferredLocation.name || "");
    if (preferredLocation.city) {
      setDestination(preferredLocation.city);
    }
  };

  // Main registration function
  const handleContinue = async () => {
    if (isSaving) return;

    console.log("Registration button pressed");
    console.log("Current registration step:", step);

    // STEP 1: SENDER INFORMATION
    if (step === 1) {
      if (!senderName.trim() || !senderPhone.trim()) {
        showMessage(
          "Missing Information",
          "Please enter the sender's full name and phone number."
        );
        return;
      }

      if (!isValidPhone(senderPhone)) {
        showMessage(
          "Invalid Phone Number",
          "Please enter a valid Zimbabwean mobile number, e.g. 0771234567."
        );
        return;
      }

      setStep(2);
      return;
    }

    // STEP 2: RECIPIENT INFORMATION
    if (step === 2) {
      if (
        !recipientName.trim() ||
        !recipientPhone.trim() ||
        !destination.trim() ||
        !collectionPoint.trim() ||
        !nextOfKinName.trim() ||
        !nextOfKinPhone.trim()
      ) {
        showMessage(
          "Missing Information",
          "Please complete all recipient, destination and next-of-kin fields."
        );
        return;
      }

      if (
        !isValidPhone(recipientPhone) ||
        !isValidPhone(nextOfKinPhone)
      ) {
        showMessage(
          "Invalid Phone Number",
          "Please check the recipient and next-of-kin phone numbers."
        );
        return;
      }

      setStep(3);
      return;
    }

    // STEP 3: PARCEL DETAILS
    if (step === 3) {
      const quantity = Number(parcelQuantity);
      const value = Number(parcelValue);

      if (!parcelDescription.trim()) {
        showMessage(
          "Missing Information",
          "Please enter a parcel description."
        );
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        showMessage(
          "Invalid Quantity",
          "Please enter a whole number of at least 1."
        );
        return;
      }

      if (
        parcelValue.trim() === "" ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        showMessage(
          "Invalid Parcel Value",
          "Please enter a valid parcel value."
        );
        return;
      }

      // SAVE PARCEL
      try {
        setIsSaving(true);
        const collectionCode = generateCollectionCode();

        console.log("Starting parcel registration...");

        const savedParcel = await saveParcel({
          collectionCode,
          status: "Registered",
          sender: {
            fullName: senderName.trim(),
            phone: senderPhone.trim(),
          },

          recipient: {
            fullName: recipientName.trim(),
            phone: recipientPhone.trim(),
          },

          destination: {
            town: destination.trim(),
            collectionPoint: collectionPoint.trim(),
            preferredLocationId: preferredLocation?.id || null,
          },

          nextOfKin: {
            fullName: nextOfKinName.trim(),
            phone: nextOfKinPhone.trim(),
          },

          parcel: {
            description: parcelDescription.trim(),
            quantity: quantity,
            estimatedValueUSD: value,
          },
        });

        console.log("Parcel saved successfully:", savedParcel);

        const activeCollectionCode = savedParcel?.collectionCode || collectionCode;
        const successMessage =
          `Your parcel has been registered successfully.\n\n` +
          `Parcel Reference: ${savedParcel.id}\n` +
          `Collection Code: ${activeCollectionCode}\n` +
          `Share this code with the recipient for pickup verification.`;

        if (Platform.OS === "web") {
          window.alert(`Registration Successful!\n\n${successMessage}`);
          resetForm();

          if (onBack) {
            onBack();
          }
        } else {
          Alert.alert(
            "Registration Successful! 🎉",
            successMessage,
            [
              {
                text: "Register Another",
                onPress: resetForm,
              },
              {
                text: "Done",
                onPress: () => {
                  resetForm();

                  if (onBack) {
                    onBack();
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error("PARCEL REGISTRATION ERROR:", error);

        showMessage(
          "Registration Failed",
          error?.message ||
            "We could not save your parcel. Please try again."
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Reusable input component
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
        autoCapitalize={
          keyboardType === "default" ? "words" : "none"
        }
      />
    </View>
  );

  const progressWidth = `${(step / 3) * 100}%`;

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
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                if (step > 1) {
                  setStep(step - 1);
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

          {/* INTRODUCTION */}
          <View style={styles.introduction}>
            <Text style={styles.title}>Send a Parcel 📦</Text>

            <Text style={styles.subtitle}>
              Complete the information below to get your parcel
              ready for delivery.
            </Text>
          </View>

          {/* PROGRESS */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: progressWidth },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              STEP {step} OF 3
            </Text>
          </View>

          {/* STEP 1: SENDER INFORMATION */}
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

          {/* STEP 2: RECIPIENT INFORMATION */}
          {step === 2 && (
            <View style={styles.section}>
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

              <Text style={styles.kinTitle}>
                Destination Information
              </Text>

              {preferredLocation && (
                <View style={styles.preferredCard}>
                  <View style={styles.preferredRow}>
                    <View style={styles.preferredTextWrap}>
                      <Text style={styles.preferredEyebrow}>
                        SAVED PREFERRED LOCATION
                      </Text>
                      <Text style={styles.preferredName}>
                        📍 {preferredLocation.name} ({preferredLocation.city})
                      </Text>
                      <Text style={styles.preferredAddress}>
                        {preferredLocation.address}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.usePreferredBtn}
                      activeOpacity={0.8}
                      onPress={applyPreferredLocation}
                    >
                      <Text style={styles.usePreferredText}>Use</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {renderInput(
                "Destination Town / City",
                "e.g. Harare, Bulawayo",
                destination,
                setDestination
              )}

              {renderInput(
                "Collection Point",
                "Enter preferred collection point",
                collectionPoint,
                setCollectionPoint
              )}

              <View style={styles.divider} />

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

          {/* STEP 3: PARCEL DETAILS */}
          {step === 3 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.stepNumber}>03</Text>

                <View>
                  <Text style={styles.sectionTitle}>
                    Parcel Details
                  </Text>

                  <Text style={styles.sectionDescription}>
                    Tell us about the parcel you are sending.
                  </Text>
                </View>
              </View>

              {renderInput(
                "Parcel Description",
                "e.g. Clothes, electronics, documents",
                parcelDescription,
                setParcelDescription
              )}

              {renderInput(
                "Number of Parcels",
                "Enter parcel quantity",
                parcelQuantity,
                setParcelQuantity,
                "number-pad"
              )}

              {renderInput(
                "Estimated Parcel Value (USD)",
                "e.g. 50",
                parcelValue,
                setParcelValue,
                "decimal-pad"
              )}

              <Text style={styles.note}>
                Parcel value helps us determine the appropriate
                handling and pricing. Final charges will be
                calculated in a later step.
              </Text>
            </View>
          )}

          {/* MAIN BUTTON */}
          <Pressable
            style={[
              styles.button,
              isSaving && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>
              {isSaving
                ? "Saving Parcel..."
                : step === 3
                ? "Complete Registration ✓"
                : "Continue →"}
            </Text>
          </Pressable>

          {/* FOOTER */}
          <Text style={styles.footerText}>
            Svitsai – Send with confidence.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// STYLES
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

  preferredCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D8DFD5",
  },

  preferredRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  preferredTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  preferredEyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  preferredName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 3,
  },

  preferredAddress: {
    color: "#666666",
    fontSize: 12,
    marginTop: 2,
  },

  usePreferredBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },

  usePreferredText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
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
    marginBottom: 12,
  },

  note: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 2,
  },

  button: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
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