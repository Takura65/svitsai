import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { getParcelById } from "../services/parcelStorage";
import AskSvitsaiCard from "../components/AskSvitsaiCard";

function showAlert(title, message) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function formatTimestamp(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case "Registered":
      return { bg: "#E0F2FE", text: "#0369A1" };
    case "Awaiting Collection":
      return { bg: "#FEF3C7", text: "#B45309" };
    case "In Transit":
      return { bg: "#EDE9FE", text: "#6D28D9" };
    case "Ready for Collection":
      return { bg: "#DCFCE7", text: "#15803D" };
    case "Collected":
      return { bg: "#F1F5F9", text: "#334155" };
    default:
      return { bg: "#E2E8F0", text: "#1E293B" };
  }
}

export default function ParcelTrackingScreen({ route }) {
  const initialRef = route?.params?.parcelId || route?.params?.trackingCode || "";

  const [searchCode, setSearchCode] = useState(initialRef);
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialRef) {
      handleSearch(initialRef);
    }
  }, [initialRef]);

  async function handleSearch(overrideCode) {
    const cleanCode = String(overrideCode ?? searchCode)
      .trim()
      .toUpperCase();

    if (!cleanCode) {
      showAlert("Missing Reference", "Please enter a parcel tracking reference (e.g., SVT-123456789).");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const found = await getParcelById(cleanCode);
      if (!found) {
        setParcel(null);
        setErrorMessage(
          `No parcel found for "${cleanCode}". Check the reference number or verify you are signed into the authorized account.`
        );
      } else {
        setParcel(found);
      }
    } catch (err) {
      setParcel(null);
      setErrorMessage(err?.message || "Failed to load parcel tracking details.");
    } finally {
      setLoading(false);
    }
  }

  const badge = getStatusBadgeStyle(parcel?.status);
  const statusHistory = Array.isArray(parcel?.statusHistory) ? parcel.statusHistory : [];
  const checkpoints = Array.isArray(parcel?.checkpoints) ? parcel.checkpoints : [];
  const handover = parcel?.transportHandover || null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Track Parcel</Text>
      <Text style={styles.screenSubtitle}>
        Enter your Svitsai reference number to view live status, transit checkpoints, and pickup details.
      </Text>

      {/* Search Bar */}
      <View style={styles.searchCard}>
        <Text style={styles.label}>Parcel Reference</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. SVT-482910345"
            autoCapitalize="characters"
            autoCorrect={false}
            value={searchCode}
            onChangeText={setSearchCode}
            onSubmitEditing={() => handleSearch()}
          />
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.buttonDisabled]}
            onPress={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Track</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error State */}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Parcel Not Found</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Parcel Details */}
      {parcel ? (
        <>
          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.parcelId}>{parcel.id}</Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>
                  {parcel.status}
                </Text>
              </View>
            </View>

            {/* 6-Digit Collection Code Banner when Ready for Collection */}
            {parcel.status === "Ready for Collection" && parcel.collectionCode ? (
              <View style={styles.codeBanner}>
                <Text style={styles.codeBannerLabel}>6-Digit Collection Code</Text>
                <Text style={styles.codeBannerValue}>{parcel.collectionCode}</Text>
                <Text style={styles.codeBannerHint}>
                  Present this code at {parcel.collectionPoint} ({parcel.destinationTown}) to collect your parcel.
                </Text>
              </View>
            ) : null}

            {/* Collected Confirmation Banner */}
            {parcel.status === "Collected" ? (
              <View style={styles.collectedBanner}>
                <Text style={styles.collectedTitle}>Parcel Collected</Text>
                <Text style={styles.collectedText}>
                  Collected on {formatTimestamp(parcel.collectedAt)}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Item</Text>
                <Text style={styles.detailValue}>
                  {parcel.description} (Qty: {parcel.quantity ?? 1})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sender</Text>
                <Text style={styles.detailValue}>{parcel.senderName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{parcel.recipientName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Destination</Text>
                <Text style={styles.detailValue}>{parcel.destinationTown}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Collection Store</Text>
                <Text style={styles.detailValue}>{parcel.collectionPoint}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registered</Text>
                <Text style={styles.detailValue}>
                  {formatTimestamp(parcel.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Ask Svitsai AI Assistant Card */}
          <AskSvitsaiCard trackingCode={parcel.id} />

          {/* Transport Handover Details */}
          {handover ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Transport Handover</Text>
              <Text style={styles.itemTitle}>
                Partner: {handover.partner || "Assigned Carrier"}
              </Text>
              {handover.contactPerson ? (
                <Text style={styles.itemSub}>Contact: {handover.contactPerson}</Text>
              ) : null}
              {handover.vehicleDetails ? (
                <Text style={styles.itemSub}>Vehicle: {handover.vehicleDetails}</Text>
              ) : null}
              {handover.notes ? (
                <Text style={styles.itemNote}>{handover.notes}</Text>
              ) : null}
              <Text style={styles.itemTime}>
                Handed over: {formatTimestamp(handover.handedOverAt || handover.timestamp)}
              </Text>
            </View>
          ) : null}

          {/* Transit Checkpoints */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transit Checkpoints</Text>
            {checkpoints.length === 0 ? (
              <Text style={styles.emptyText}>No transit checkpoints recorded yet.</Text>
            ) : (
              checkpoints.map((cp, index) => (
                <View key={cp.id || `${cp.location}-${index}`} style={styles.timelineItem}>
                  <Text style={styles.itemTitle}>{cp.location}</Text>
                  {cp.note ? <Text style={styles.itemNote}>{cp.note}</Text> : null}
                  <Text style={styles.itemTime}>
                    {formatTimestamp(cp.recordedAt || cp.timestamp)}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Status History */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status History</Text>
            {statusHistory.length === 0 ? (
              <Text style={styles.emptyText}>No status updates available.</Text>
            ) : (
              statusHistory.map((entry, index) => (
                <View key={entry.id || `${entry.status}-${index}`} style={styles.timelineItem}>
                  <Text style={styles.itemTitle}>{entry.status}</Text>
                  {entry.note ? <Text style={styles.itemNote}>{entry.note}</Text> : null}
                  <Text style={styles.itemTime}>
                    {formatTimestamp(entry.recordedAt || entry.timestamp)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    marginBottom: 14,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
  },
  searchButton: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  errorCard: {
    marginTop: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    marginTop: 4,
  },
  card: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  parcelId: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  codeBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  codeBannerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  codeBannerValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 6,
    marginVertical: 4,
  },
  codeBannerHint: {
    fontSize: 12,
    color: "#166534",
    textAlign: "center",
  },
  collectedBanner: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  collectedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  collectedText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  detailGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
    maxWidth: "62%",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  timelineItem: {
    borderLeftWidth: 2,
    borderLeftColor: "#0284C7",
    paddingLeft: 10,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  itemSub: {
    fontSize: 13,
    color: "#334155",
    marginTop: 2,
  },
  itemNote: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
  },
});