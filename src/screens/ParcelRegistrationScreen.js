
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
} from "react-native";

import { COLORS } from "../theme/colors";

export default function ParcelRegistrationScreen({ onBack }) {
  // Store the information entered by the sender
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>

          <Text style={styles.brandName}>Svitsai</Text>
        </View>

        {/* Page Introduction */}
        <View style={styles.introduction}>
          <Text style={styles.title}>
            Send a Parcel 📦
          </Text>

          <Text style={styles.subtitle}>
            Enter your details to get started with your delivery.
          </Text>
        </View>

        {/* Sender Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Sender Information
          </Text>

          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#999999"
            value={senderName}
            onChangeText={setSenderName}
          />

          <Text style={styles.label}>
            Phone Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 0771234567"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
            value={senderPhone}
            onChangeText={setSenderPhone}
          />
        </View>

        {/* Continue Button */}
        <Pressable
          style={styles.button}
          onPress={() => {
            if (!senderName.trim() || !senderPhone.trim()) {
              Alert.alert(
                "Missing information",
                "Please enter your name and phone number."
              );
              return;
            }

            Alert.alert(
              "Sender details saved",
              "Great! Your sender information has been entered."
            );
          }}
        >
          <Text style={styles.buttonText}>
            Continue
          </Text>
        </Pressable>

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  backButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  introduction: {
    paddingHorizontal: 20,
    marginTop: 15,
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

  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D8DFD5",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 18,
    backgroundColor: COLORS.background,
  },

  button: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
