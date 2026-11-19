import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATIONS_STORAGE_KEY = "@svitsai_collection_locations";
const SELECTED_LOCATION_KEY = "@svitsai_selected_collection_location";

export const DEFAULT_COLLECTION_LOCATIONS = [
  {
    id: "LOC-HRE-CBD",
    name: "Svitsai Harare CBD Hub",
    city: "Harare",
    address: "48 Jason Moyo Ave, Harare CBD",
    hours: "Mon–Sat: 08:00 – 17:30",
    phone: "+263 242 700 110",
    status: "Open",
  },
  {
    id: "LOC-HRE-BOR",
    name: "Borrowdale Sam Levy Point",
    city: "Harare",
    address: "Borrowdale Rd, Harare",
    hours: "Mon–Sun: 08:30 – 18:00",
    phone: "+263 242 882 340",
    status: "Open",
  },
  {
    id: "LOC-BYO-CBD",
    name: "Bulawayo Main Pickup Depot",
    city: "Bulawayo",
    address: "92 Joshua Mqabuko Nkomo St, Bulawayo",
    hours: "Mon–Sat: 08:00 – 17:00",
    phone: "+263 292 604 88",
    status: "Open",
  },
  {
    id: "LOC-MUT-CTR",
    name: "Mutare Central Collection Desk",
    city: "Mutare",
    address: "15 Herbert Chitepo St, Mutare",
    hours: "Mon–Sat: 08:00 – 17:00",
    phone: "+263 202 063 210",
    status: "Open",
  },
];

export const getCollectionLocations = async () => {
  try {
    const stored = await AsyncStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (!stored) {
      await AsyncStorage.setItem(
        LOCATIONS_STORAGE_KEY,
        JSON.stringify(DEFAULT_COLLECTION_LOCATIONS)
      );
      return [...DEFAULT_COLLECTION_LOCATIONS];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [...DEFAULT_COLLECTION_LOCATIONS];
  } catch (error) {
    console.error("Error loading collection locations:", error);
    return [...DEFAULT_COLLECTION_LOCATIONS];
  }
};

export const addCollectionLocation = async (locationData) => {
  try {
    const name = String(locationData?.name || "").trim();
    const city = String(locationData?.city || "").trim();
    const address = String(locationData?.address || "").trim();

    if (!name || !city || !address) {
      throw new Error("Location name, city, and address are required.");
    }

    const existing = await getCollectionLocations();
    const newLocation = {
      id: `LOC-${Date.now()}`,
      name,
      city,
      address,
      hours: String(locationData?.hours || "").trim() || "Mon–Sat: 08:00 – 17:00",
      phone: String(locationData?.phone || "").trim() || "Not provided",
      status: "Open",
    };

    const updated = [newLocation, ...existing];
    await AsyncStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error adding collection location:", error);
    throw error;
  }
};

export const getSelectedLocationId = async () => {
  try {
    const id = await AsyncStorage.getItem(SELECTED_LOCATION_KEY);
    return id || DEFAULT_COLLECTION_LOCATIONS[0].id;
  } catch (error) {
    console.error("Error reading selected location:", error);
    return DEFAULT_COLLECTION_LOCATIONS[0].id;
  }
};

export const setSelectedLocationId = async (locationId) => {
  try {
    await AsyncStorage.setItem(SELECTED_LOCATION_KEY, String(locationId));
    return locationId;
  } catch (error) {
    console.error("Error saving selected location:", error);
    throw error;
  }
};