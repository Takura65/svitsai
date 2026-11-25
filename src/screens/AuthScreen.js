import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../theme/colors";
import { supabase } from "../lib/supabase";

export default function AuthScreen({ mode, onBack, onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (isSigningUp && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: authError } = isSigningUp
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

      if (authError) throw authError;

      const user = data.user || data.session?.user;
      if (isSigningUp && !data.session) {
        setMessage(
          "Account created. Check your email to confirm it, then sign in."
        );
        setIsSigningUp(false);
        setPassword("");
        setConfirmPassword("");
        return;
      }

      if (!user) {
        throw new Error("Authentication succeeded but no user was returned.");
      }

      if (mode === "staff" && user.app_metadata?.role !== "staff") {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        setError("This email is not registered as a staff account.");
        setPassword("");
        return;
      }

      onAuthenticated(user);
    } catch (authError) {
      console.error("Email authentication failed:", authError);
      const errorMessage = authError.message?.toLowerCase();
      setError(
        errorMessage?.includes("invalid login credentials")
          ? "Email or password is incorrect."
          : errorMessage?.includes("already registered")
            ? "An account already exists for this email. Sign in instead."
            : authError.message || "Unable to authenticate. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const canCreateAccount = mode !== "staff";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button">
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.brand}>Svitsai</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>
          {mode === "staff" ? "STAFF PORTAL" : "CUSTOMER ACCOUNT"}
        </Text>
        <Text style={styles.title}>
          {mode === "staff"
            ? "Staff sign in"
            : isSigningUp
              ? "Create your account"
              : "Sign in with email"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "staff"
            ? "Staff accounts must be created by an administrator."
            : isSigningUp
              ? "Create an account to register and manage your parcels."
              : "Sign in to register parcels and view your account."}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardAppearance="light"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSigningUp ? "new-password" : "current-password"}
            textContentType={isSigningUp ? "newPassword" : "password"}
            editable={!loading}
          />

          {isSigningUp ? (
            <>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!loading}
              />
            </>
          ) : null}

          <Pressable
            style={[styles.button, loading && styles.disabled]}
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isSigningUp ? "Create account" : "Sign in"}
              </Text>
            )}
          </Pressable>

          {canCreateAccount ? (
            <Pressable
              onPress={() => {
                setIsSigningUp(!isSigningUp);
                setError("");
                setMessage("");
              }}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.toggleAuth}>
                {isSigningUp
                  ? "Already have an account? Sign in"
                  : "New to Svitsai? Create an account"}
              </Text>
            </Pressable>
          ) : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  brand: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 45,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 10,
  },
  subtitle: {
    color: "#666666",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginTop: 28,
    padding: 20,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6DFD3",
    borderRadius: 10,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  toggleAuth: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  message: {
    color: COLORS.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  error: {
    color: "#B42318",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
