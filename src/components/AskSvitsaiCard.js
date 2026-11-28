import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { askSvitsaiAboutParcel } from "../services/svitsaiAiService";

export default function AskSvitsaiCard({ trackingCode }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setQuestion("");
    setAnswer("");
    setError("");
    setLoading(false);
  }, [trackingCode]);

  const handleAsk = async () => {
    const cleanTrackingCode = String(trackingCode || "").trim();
    if (!cleanTrackingCode || loading) return;

    const currentRequestId = ++requestId.current;
    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const result = await askSvitsaiAboutParcel(cleanTrackingCode, question);
      if (currentRequestId === requestId.current) {
        setAnswer(result.answer);
      }
    } catch (requestError) {
      if (currentRequestId === requestId.current) {
        setError(
          requestError?.message || "Unable to answer right now. Please try again."
        );
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ask Svitsai</Text>
      <Text style={styles.description}>
        Ask a question about this parcel, or leave it blank for a status summary.
      </Text>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Your question"
        multiline
        editable={!loading}
        accessibilityLabel="Question about this parcel"
      />
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAsk}
        disabled={loading || !trackingCode}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Ask Svitsai</Text>
        )}
      </Pressable>
      {answer ? (
        <View style={styles.answerCard}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  description: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    marginBottom: 10,
  },
  input: {
    minHeight: 76,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
    textAlignVertical: "top",
  },
  button: {
    minHeight: 44,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  answerCard: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    padding: 12,
  },
  answer: {
    fontSize: 13,
    lineHeight: 19,
    color: "#0F172A",
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: "#B91C1C",
  },
});
