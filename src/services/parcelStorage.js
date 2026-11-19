
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


// Record parcel handover
export const recordParcelHandover = async (
  parcelId,
  handoverDetails
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

    // Allow first handover for Awaiting Collection
    // Also allow missing handover details to be added to In Transit parcels
    const isFirstHandover =
      parcel.status === "Awaiting Collection";

    const isMissingHandover =
      parcel.status === "In Transit" &&
      !parcel.transportHandover;

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
      contactNumber:
        handoverDetails.contactNumber?.trim() || "",
      vehicleDetails:
        handoverDetails.vehicleDetails?.trim() || "",
      notes: handoverDetails.notes?.trim() || "",
      handedOverAt: now,
    };

    const handoverHistory = [
      ...(parcel.handoverHistory || []),
      handover,
    ];

    const updatedParcel = {
      ...parcel,

      // Preserve In Transit status or advance from Awaiting Collection
      status: "In Transit",

      transportHandover: handover,
      handoverHistory,

      updatedAt: now,

      // Only add a new status-history entry for the first handover
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

    return updatedParcel;

  } catch (error) {
    console.error("Parcel handover error:", error);
    throw error;
  }
};


// Record transport journey update
export const recordTransportUpdate = async (
  parcelId,
  updateDetails
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

      transportUpdates: [
        ...(parcel.transportUpdates || []),
        transportUpdate,
      ],

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
