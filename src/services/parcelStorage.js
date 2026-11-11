
import AsyncStorage from "@react-native-async-storage/async-storage";

const PARCELS_STORAGE_KEY = "@svitsai_parcels";

export const saveParcel = async (parcelData) => {
  try {
    const existingParcels = await getParcels();

    const newParcel = {
      id: `SVT-${Date.now()}`,
      ...parcelData,
      status: "Registered",
      createdAt: new Date().toISOString(),
    };

    const updatedParcels = [newParcel, ...existingParcels];

    await AsyncStorage.setItem(
      PARCELS_STORAGE_KEY,
      JSON.stringify(updatedParcels)
    );

    return newParcel;
  } catch (error) {
    console.error("Error saving parcel:", error);
    throw error;
  }
};

export const getParcels = async () => {
  try {
    const storedParcels = await AsyncStorage.getItem(
      PARCELS_STORAGE_KEY
    );

    return storedParcels ? JSON.parse(storedParcels) : [];
  } catch (error) {
    console.error("Error retrieving parcels:", error);
    throw error;
  }
};

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
