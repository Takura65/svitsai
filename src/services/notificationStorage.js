import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_STORAGE_KEY = "@svitsai_parcel_notifications";

export const NOTIFICATION_EVENTS = {
  REGISTERED: "Registered",
  HANDED_OVER: "Handed Over",
  IN_TRANSIT: "In Transit",
  READY_FOR_COLLECTION: "Ready for Collection",
  COLLECTED: "Collected",
};

const buildDefaultMessage = (status, trackingCode, recipientName) => {
  const codeText = trackingCode ? ` (${trackingCode})` : "";
  const recipientText = recipientName ? ` for ${recipientName}` : "";

  switch (status) {
    case NOTIFICATION_EVENTS.REGISTERED:
      return `Parcel${codeText}${recipientText} has been registered in Svitsai.`;
    case NOTIFICATION_EVENTS.HANDED_OVER:
      return `Parcel${codeText}${recipientText} has been handed over to a transport partner.`;
    case NOTIFICATION_EVENTS.IN_TRANSIT:
      return `Parcel${codeText}${recipientText} is now in transit.`;
    case NOTIFICATION_EVENTS.READY_FOR_COLLECTION:
      return `Parcel${codeText}${recipientText} is ready for collection.`;
    case NOTIFICATION_EVENTS.COLLECTED:
      return `Parcel${codeText}${recipientText} has been collected.`;
    default:
      return `Parcel${codeText} status updated to ${status}.`;
  }
};

// GET ALL NOTIFICATIONS
export const getNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading notifications:", error);
    throw error;
  }
};

// SAVE NOTIFICATIONS
const saveNotifications = async (notifications) => {
  await AsyncStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications)
  );
};

// CREATE A PARCEL NOTIFICATION
export const createParcelNotification = async ({
  parcelId = "",
  trackingCode = "",
  recipientName = "",
  senderName = "",
  status,
  message = "",
  channel = "In-App",
}) => {
  try {
    if (!status) {
      throw new Error("Notification status is required.");
    }

    const existing = await getNotifications();
    const now = new Date().toISOString();

    const newNotification = {
      id: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      parcelId: String(parcelId || "").trim(),
      trackingCode: String(trackingCode || "").trim(),
      recipientName: String(recipientName || "").trim(),
      senderName: String(senderName || "").trim(),
      status: String(status).trim(),
      message:
        message?.trim() ||
        buildDefaultMessage(
          String(status).trim(),
          String(trackingCode || "").trim(),
          String(recipientName || "").trim()
        ),
      channel,
      read: false,
      createdAt: now,
    };

    const updated = [newNotification, ...existing];
    await saveNotifications(updated);

    return newNotification;
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};

// MARK ONE NOTIFICATION AS READ
export const markNotificationRead = async (notificationId) => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item
    );

    await saveNotifications(updated);
    return updated;
  } catch (error) {
    console.error("Mark notification read error:", error);
    throw error;
  }
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsRead = async () => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map((item) => ({ ...item, read: true }));

    await saveNotifications(updated);
    return updated;
  } catch (error) {
    console.error("Mark all read error:", error);
    throw error;
  }
};

// DELETE A SINGLE NOTIFICATION
export const deleteNotification = async (notificationId) => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.filter((item) => item.id !== notificationId);

    await saveNotifications(updated);
    return updated;
  } catch (error) {
    console.error("Delete notification error:", error);
    throw error;
  }
};

// CLEAR ALL NOTIFICATIONS
export const clearAllNotifications = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    return [];
  } catch (error) {
    console.error("Clear notifications error:", error);
    throw error;
  }
};