import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createParcelNotification,
  NOTIFICATION_EVENTS,
} from "./notificationStorage";

const PARCELS_STORAGE_KEY = "@svitsai_parcels";

export const PARCEL_STATUSES = [
  "Registered",
  "Awaiting Collection",
  "In Transit",
  "Ready for Collection",
  "Collected",
];

// Normalise parcel reference numbers
const normaliseId = (id) => String(id || "").trim().toUpperCase();

// Ensure collection codes are strictly 6 numeric digits
const isValidSixDigitCode = (code) => /^\d{6}$/.test(String(code || "").trim());

// Safely emit a parcel notification without breaking parcel storage actions
const emitParcelNotification = async (parcel, eventStatus, customMessage = "") => {
  try {
    if (!parcel) return;

    const recipientName =
      typeof parcel.recipient === "object"
        ? parcel.recipient?.fullName || ""
        : parcel.recipient || parcel.recipientName || "";

    const senderName =
      typeof parcel.sender === "object"
        ? parcel.sender?.fullName || ""
        : parcel.sender || parcel.senderName || "";

    await createParcelNotification({
      parcelId: parcel.id || "",
      trackingCode: parcel.trackingCode || parcel.id || "",
      recipientName,
      senderName,
      status: eventStatus,
      message: customMessage,
    });
  } catch (notifError) {
    console.error("Notification creation failed (non-blocking):", notifError);
  }
};

// Get all parcels
export const getParcels = async () => {
  try {
    const stored = await AsyncStorage.getItem(PARCELS_STORAGE_KEY);

    if (!stored) return [];

    const parcels = JSON.parse(stored);

    return Array.isArray(parcels) ? parcels : [];
  } catch (error) {
    console.error("Error retrieving parcels:", error);
    throw error;
  }
};

// Save all parcels
const saveParcels = async (parcels) => {
  await AsyncStorage.setItem(
    PARCELS_STORAGE_KEY,
    JSON.stringify(parcels)
  );
};

// Get one parcel
export const getParcelById = async (parcelId) => {
  const parcels = await getParcels();
  const searchId = normaliseId(parcelId);

  return (
    parcels.find((parcel) => normaliseId(parcel.id) === searchId) || null
  );
};

// Generate a unique six-digit numeric collection code
const generateUniqueCollectionCode = (parcels) => {
  const existingCodes = new Set(
    parcels
      .map((parcel) => String(parcel.collectionCode || "").trim())
      .filter(isValidSixDigitCode)
  );

  if (existingCodes.size >= 900000) {
    throw new Error("Unable to generate a unique collection code.");
  }

  let code;

  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (existingCodes.has(code));

  return code;
};

// Save new parcel
export const saveParcel = async (parcelData) => {
  try {
    const parcels = await getParcels();
    const now = new Date().toISOString();

    const newParcel = {
      ...parcelData,
      id: `SVT-${Date.now()}`,
      status: "Registered",
      collectionCode: null,
      collectedAt: null,
      statusHistory: [
        {
          status: "Registered",
          timestamp: now,
          note: "Parcel registration completed.",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await saveParcels([newParcel, ...parcels]);
    await emitParcelNotification(newParcel, NOTIFICATION_EVENTS.REGISTERED);

    return newParcel;
  } catch (error) {
    console.error("Error saving parcel:", error);
    throw error;
  }
};

// Update parcel status
export const updateParcelStatus = async (parcelId, newStatus, note = "") => {
  try {
    if (!PARCEL_STATUSES.includes(newStatus)) {
      throw new Error("Invalid parcel status.");
    }

    // Collection must only happen through code verification.
    if (newStatus === "Collected") {
      throw new Error(
        "Use collection code verification to complete collection."
      );
    }

    const parcels = await getParcels();
    const searchId = normaliseId(parcelId);

    const parcelIndex = parcels.findIndex(
      (item) => normaliseId(item.id) === searchId
    );

    if (parcelIndex === -1) {
      throw new Error("Parcel not found.");
    }

    const parcel = parcels[parcelIndex];

    const currentIndex = PARCEL_STATUSES.indexOf(parcel.status);
    const newIndex = PARCEL_STATUSES.indexOf(newStatus);

    if (currentIndex === -1 || newIndex < currentIndex) {
      throw new Error("Invalid parcel status progression.");
    }

    const now = new Date().toISOString();
    const existingValidCode = isValidSixDigitCode(parcel.collectionCode)
      ? String(parcel.collectionCode).trim()
      : null;

    // Generate and save a numeric 6-digit code when parcel becomes ready.
    const collectionCode =
      newStatus === "Ready for Collection"
        ? existingValidCode || generateUniqueCollectionCode(parcels)
        : existingValidCode;

    // Avoid duplicate history or duplicate alerts when selecting the current status,
    // while repairing any non-numeric code if already Ready for Collection.
    if (newStatus === parcel.status) {
      const repairedParcel = {
        ...parcel,
        collectionCode,
        updatedAt: now,
      };

      parcels[parcelIndex] = repairedParcel;
      await saveParcels(parcels);

      return repairedParcel;
    }

    const updatedParcel = {
      ...parcel,
      status: newStatus,
      collectionCode,
      updatedAt: now,
      statusHistory: [
        ...(parcel.statusHistory || []),
        {
          status: newStatus,
          timestamp: now,
          note: note.trim() || "Parcel status updated by staff.",
        },
      ],
    };

    parcels[parcelIndex] = updatedParcel;

    await saveParcels(parcels);

    if (newStatus === "In Transit") {
      await emitParcelNotification(
        updatedParcel,
        NOTIFICATION_EVENTS.IN_TRANSIT
      );
    } else if (newStatus === "Ready for Collection") {
      const codeNotice = collectionCode
        ? `Parcel (${updatedParcel.id}) is ready for collection. Collection code: ${collectionCode}.`
        : "";
      await emitParcelNotification(
        updatedParcel,
        NOTIFICATION_EVENTS.READY_FOR_COLLECTION,
        codeNotice
      );
    }

    return updatedParcel;
  } catch (error) {
    console.error("Status update error:", error);
    throw error;
  }
};

// Verify six-digit collection code
export const verifyCollectionCode = async (parcelId, enteredCode) => {
  try {
    const parcels = await getParcels();
    const searchId = normaliseId(parcelId);

    const parcelIndex = parcels.findIndex(
      (item) => normaliseId(item.id) === searchId
    );

    if (parcelIndex === -1) {
      throw new Error("Parcel not found.");
    }

    const parcel = parcels[parcelIndex];

    if (parcel.status === "Collected") {
      throw new Error("This parcel has already been collected.");
    }

    if (parcel.status !== "Ready for Collection") {
      throw new Error("Parcel is not ready for collection.");
    }

    if (!isValidSixDigitCode(parcel.collectionCode)) {
      throw new Error(
        "A valid six-digit collection code has not been generated. Update the parcel status first."
      );
    }

    const submittedCode = String(enteredCode || "").trim();

    if (!isValidSixDigitCode(submittedCode)) {
      throw new Error("Enter a valid six-digit collection code.");
    }

    if (submittedCode !== String(parcel.collectionCode).trim()) {
      throw new Error("Incorrect collection code.");
    }

    const now = new Date().toISOString();

    const updatedParcel = {
      ...parcel,
      status: "Collected",
      collectionCode: String(parcel.collectionCode).trim(),
      collectedAt: now,
      updatedAt: now,
      statusHistory: [
        ...(parcel.statusHistory || []),
        {
          status: "Collected",
          timestamp: now,
          note: "Collection successfully verified by staff.",
        },
      ],
    };

    parcels[parcelIndex] = updatedParcel;

    await saveParcels(parcels);
    await emitParcelNotification(updatedParcel, NOTIFICATION_EVENTS.COLLECTED);

    return updatedParcel;
  } catch (error) {
    console.error("Collection verification error:", error);
    throw error;
  }
};

// Delete parcel
export const deleteParcel = async (parcelId) => {
  try {
    const parcels = await getParcels();
    const searchId = normaliseId(parcelId);

    const updatedParcels = parcels.filter(
      (parcel) => normaliseId(parcel.id) !== searchId
    );

    await saveParcels(updatedParcels);
  } catch (error) {
    console.error("Error deleting parcel:", error);
    throw error;
  }
};

// Record parcel handover
export const recordParcelHandover = async (parcelId, handoverDetails) => {
  try {
    const parcels = await getParcels();
    const searchId = normaliseId(parcelId);

    const parcelIndex = parcels.findIndex(
      (item) => normaliseId(item.id) === searchId
    );

    if (parcelIndex === -1) {
      throw new Error("Parcel not found.");
    }

    const parcel = parcels[parcelIndex];

    const isFirstHandover = parcel.status === "Awaiting Collection";
    const isMissingHandover =
      parcel.status === "In Transit" && !parcel.transportHandover;

    if (!isFirstHandover && !isMissingHandover) {
      throw new Error(
        "This parcel cannot be handed over in its current status or already has handover details."
      );
    }

    const partner = handoverDetails.partner?.trim();
    const contactPerson = handoverDetails.contactPerson?.trim();

    if (!partner || !contactPerson) {
      throw new Error(
        "Transport partner and contact person are required."
      );
    }

    const now = new Date().toISOString();

    const handover = {
      id: `HO-${Date.now()}`,
      partner,
      contactPerson,
      contactNumber: handoverDetails.contactNumber?.trim() || "",
      vehicleDetails: handoverDetails.vehicleDetails?.trim() || "",
      notes: handoverDetails.notes?.trim() || "",
      handedOverAt: now,
    };

    const handoverHistory = [...(parcel.handoverHistory || []), handover];

    const updatedParcel = {
      ...parcel,
      status: "In Transit",
      transportHandover: handover,
      handoverHistory,
      updatedAt: now,
      statusHistory: isFirstHandover
        ? [
            ...(parcel.statusHistory || []),
            {
              status: "In Transit",
              timestamp: now,
              note: `Parcel handed over to ${partner}. Contact: ${contactPerson}.`,
            },
          ]
        : parcel.statusHistory || [],
    };

    parcels[parcelIndex] = updatedParcel;

    await saveParcels(parcels);
    await emitParcelNotification(
      updatedParcel,
      NOTIFICATION_EVENTS.HANDED_OVER,
      `Parcel (${updatedParcel.id}) has been handed over to ${partner} (${contactPerson}).`
    );

    return updatedParcel;
  } catch (error) {
    console.error("Parcel handover error:", error);
    throw error;
  }
};

// Record transport journey update
export const recordTransportUpdate = async (parcelId, updateDetails) => {
  try {
    const parcels = await getParcels();
    const searchId = normaliseId(parcelId);

    const parcelIndex = parcels.findIndex(
      (item) => normaliseId(item.id) === searchId
    );

    if (parcelIndex === -1) {
      throw new Error("Parcel not found.");
    }

    const parcel = parcels[parcelIndex];

    if (parcel.status !== "In Transit") {
      throw new Error(
        "Transport updates can only be recorded for parcels in transit."
      );
    }

    const location = updateDetails.location?.trim();
    const note = updateDetails.note?.trim();

    if (!location) {
      throw new Error("Current location is required.");
    }

    if (!note) {
      throw new Error("A transport update note is required.");
    }

    const now = new Date().toISOString();

    const transportUpdate = {
      id: `TR-${Date.now()}`,
      location,
      note,
      updatedAt: now,
    };

    const updatedParcel = {
      ...parcel,
      transportUpdates: [...(parcel.transportUpdates || []), transportUpdate],
      updatedAt: now,
    };

    parcels[parcelIndex] = updatedParcel;

    await saveParcels(parcels);

    return updatedParcel;
  } catch (error) {
    console.error("Transport update error:", error);
    throw error;
  }
};