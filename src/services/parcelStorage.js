
import AsyncStorage from "@react-native-async-storage/async-storage";

const PARCELS_STORAGE_KEY = "@svitsai_parcels";

export const PARCEL_STATUSES = [
  "Registered",
  "Awaiting Collection",
  "In Transit",
  "Ready for Collection",
  "Collected",
];

// Normalise parcel reference numbers
const normaliseId = (id) =>
  String(id || "").trim().toUpperCase();

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
    parcels.find(
      (parcel) => normaliseId(parcel.id) === searchId
    ) || null
  );
};

// Generate a unique six-digit collection code
const generateUniqueCollectionCode = (parcels) => {
  const existingCodes = new Set(
    parcels.map((parcel) => parcel.collectionCode).filter(Boolean)
  );

  if (existingCodes.size >= 900000) {
    throw new Error("Unable to generate a unique collection code.");
  }

  let code;

  do {
    code = String(
      Math.floor(100000 + Math.random() * 900000)
    );
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

    return newParcel;
  } catch (error) {
    console.error("Error saving parcel:", error);
    throw error;
  }
};

// Update parcel status
export const updateParcelStatus = async (
  parcelId,
  newStatus,
  note = ""
) => {
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

    // Generate and save a code when parcel becomes ready.
    const collectionCode =
      newStatus === "Ready for Collection"
        ? parcel.collectionCode ||
          generateUniqueCollectionCode(parcels)
        : parcel.collectionCode || null;

    // Avoid duplicate history when selecting the current status.
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

    return updatedParcel;
  } catch (error) {
    console.error("Status update error:", error);
    throw error;
  }
};

// Verify six-digit collection code
export const verifyCollectionCode = async (
  parcelId,
  enteredCode
) => {
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

    if (!parcel.collectionCode) {
      throw new Error(
        "Collection code has not been generated. Update the parcel status first."
      );
    }

    const submittedCode = String(enteredCode || "").trim();

    if (!/^\d{6}$/.test(submittedCode)) {
      throw new Error("Enter a valid six-digit collection code.");
    }

    if (submittedCode !== String(parcel.collectionCode)) {
      throw new Error("Incorrect collection code.");
    }

    const now = new Date().toISOString();

    const updatedParcel = {
      ...parcel,
      status: "Collected",
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
