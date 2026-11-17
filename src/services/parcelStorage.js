
import AsyncStorage from "@react-native-async-storage/async-storage";

const PARCELS_STORAGE_KEY = "@svitsai_parcels";

export const PARCEL_STATUSES = [
  "Registered",
  "Awaiting Collection",
  "In Transit",
  "Ready for Collection",
  "Collected",
];

// Retrieve all parcels
export const getParcels = async () => {
  try {
    const stored = await AsyncStorage.getItem(PARCELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving parcels:", error);
    throw error;
  }
};

// Retrieve one parcel using its tracking ID
export const getParcelById = async (parcelId) => {
  try {
    const parcels = await getParcels();

    return parcels.find(
      (parcel) => parcel.id === parcelId
    ) || null;
  } catch (error) {
    console.error("Error retrieving parcel:", error);
    throw error;
  }
};

// Register a new parcel
export const saveParcel = async (parcelData) => {
  try {
    const parcels = await getParcels();
    const now = new Date().toISOString();

    const newParcel = {
      id: `SVT-${Date.now()}`,
      ...parcelData,
      status: "Registered",
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

    await AsyncStorage.setItem(
      PARCELS_STORAGE_KEY,
      JSON.stringify([newParcel, ...parcels])
    );

    return newParcel;
  } catch (error) {
    console.error("Error saving parcel:", error);
    throw error;
  }
};

// Update parcel delivery status
export const updateParcelStatus = async (
  parcelId,
  newStatus,
  note = ""
) => {
  try {
    const statusIndex = PARCEL_STATUSES.indexOf(newStatus);

    if (statusIndex === -1) {
      throw new Error("Invalid parcel status.");
    }

    const parcels = await getParcels();

    const parcel = parcels.find(
      (item) => item.id === parcelId
    );

    if (!parcel) {
      throw new Error("Parcel not found.");
    }

    const currentIndex = PARCEL_STATUSES.indexOf(parcel.status);

    if (currentIndex === -1) {
      throw new Error("Current parcel status is invalid.");
    }

    if (statusIndex < currentIndex) {
      throw new Error("Parcel status cannot move backwards.");
    }

    if (newStatus === parcel.status) {
      return parcel;
    }

    const now = new Date().toISOString();

    const updatedParcel = {
      ...parcel,
      status: newStatus,
      updatedAt: now,
      statusHistory: [
        ...(parcel.statusHistory || []),
        {
          status: newStatus,
          timestamp: now,
          note,
        },
      ],
    };

    const updatedParcels = parcels.map((item) =>
      item.id === parcelId ? updatedParcel : item
    );

    await AsyncStorage.setItem(
      PARCELS_STORAGE_KEY,
      JSON.stringify(updatedParcels)
    );

    return updatedParcel;
  } catch (error) {
    console.error("Error updating parcel status:", error);
    throw error;
  }
};

// Delete parcel
export const deleteParcel = async (parcelId) => {
  try {
    const parcels = await getParcels();

    const updatedParcels = parcels.filter(
      (parcel) => parcel.id !== parcelId
    );

    await AsyncStorage.setItem(
      PARCELS_STORAGE_KEY,
      JSON.stringify(updatedParcels)
    );
  } catch (error) {
    console.error("Error deleting parcel:", error);
    throw error;
  }
};
