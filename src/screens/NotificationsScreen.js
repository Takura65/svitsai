import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import { COLORS } from "../theme/colors";
import {
  getNotifications,
  createParcelNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  NOTIFICATION_EVENTS,
} from "../services/notificationStorage";

const STATUS_OPTIONS = [
  NOTIFICATION_EVENTS.REGISTERED,
  NOTIFICATION_EVENTS.HANDED_OVER,
  NOTIFICATION_EVENTS.IN_TRANSIT,
  NOTIFICATION_EVENTS.READY_FOR_COLLECTION,
  NOTIFICATION_EVENTS.COLLECTED,
];

export default function NotificationsScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // "ALL" | "UNREAD"
  const [selectedStatus, setSelectedStatus] = useState(
    NOTIFICATION_EVENTS.REGISTERED
  );
  const [creatingSample, setCreatingSample] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load notifications error:", error);
      Alert.alert(
        "Loading Failed",
        error.message || "Unable to load parcel notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleCreateTestNotification = async () => {
    try {
      setCreatingSample(true);
      const sampleCode = `SVT-${Math.floor(100000 + Math.random() * 900000)}`;

      await createParcelNotification({
        trackingCode: sampleCode,
        recipientName: "Tendai Moyo",
        senderName: "Thabani Mlambo",
        status: selectedStatus,
      });

      await loadNotifications();
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Could not create test notification."
      );
    } finally {
      setCreatingSample(false);
    }
  };

  const handleMarkRead = async (id) => {
    const updated = await markNotificationRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsRead();
    setNotifications(updated);
  };

  const handleDeleteItem = async (id) => {
    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" &&
        window.confirm("Remove this notification?");
      if (!ok) return;
    }

    const updated = await deleteNotification(id);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications =
    filter === "UNREAD"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.brand}>Svitsai</Text>

        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>SENDER UPDATES</Text>
        <Text style={styles.title}>Parcel Notifications</Text>
        <Text style={styles.subtitle}>
          Track delivery milestones from registration through collection.
        </Text>

        {/* QUICK TEST TRIGGER FOR LOCAL TESTING */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Simulate Milestone Alert</Text>
          <Text style={styles.helperText}>
            Test notifications directly in AsyncStorage before wiring status
            updates:
          </Text>

          <View style={styles.chipsRow}>
            {STATUS_OPTIONS.map((status) => {
              const active = selectedStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleCreateTestNotification}
            disabled={creatingSample}
          >
            <Text style={styles.primaryButtonText}>
              {creatingSample
                ? "Creating Alert..."
                : `Send "${selectedStatus}" Alert`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FILTER & ACTIONS BAR */}
        <View style={styles.toolbar}>
          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "ALL" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("ALL")}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "ALL" && styles.filterTextActive,
                ]}
              >
                All ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "UNREAD" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("UNREAD")}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === "UNREAD" && styles.filterTextActive,
                ]}
              >
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 25 }}
          />
        ) : visibleNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              {filter === "UNREAD"
                ? "All notifications have been read."
                : "Parcel status alerts will appear here as deliveries progress."}
            </Text>
          </View>
        ) : (
          visibleNotifications.map((item) => (
            <View
              key={item.id}
              style={[styles.notifCard, !item.read && styles.unreadCard]}
            >
              <View style={styles.notifTopRow}>
                <Text style={styles.statusBadge}>{item.status}</Text>
                {!item.read && <Text style={styles.unreadDot}>● NEW</Text>}
              </View>

              <Text style={styles.notifMessage}>{item.message}</Text>

              {!!item.trackingCode && (
                <Text style={styles.metaText}>
                  Tracking: {item.trackingCode}
                </Text>
              )}

              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              <View style={styles.notifActions}>
                {!item.read && (
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => handleMarkRead(item.id)}
                  >
                    <Text style={styles.smallBtnText}>Mark Read</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteSmallBtn}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Text style={styles.deleteSmallText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadNotifications}
        >
          <Text style={styles.refreshText}>↻ Refresh Notifications</Text>
        </TouchableOpacity>
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
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  helperText: {
    color: "#666666",
    fontSize: 13,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  filterGroup: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  markAllText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#777777",
    textAlign: "center",
    marginTop: 6,
  },
  notifCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notifTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusBadge: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  unreadDot: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
  },
  notifMessage: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 6,
  },
  metaText: {
    color: "#777777",
    fontSize: 12,
    marginTop: 2,
  },
  notifActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  smallBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  smallBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  deleteSmallBtn: {
    backgroundColor: "#FDECEC",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  deleteSmallText: {
    color: "#B83232",
    fontWeight: "700",
    fontSize: 12,
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
});