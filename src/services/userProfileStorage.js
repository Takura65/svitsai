import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_PROFILE_STORAGE_KEY = "@svitsai_user_profile";
const WELCOME_SEEN_KEY = "@svitsai_has_seen_welcome";

export const DEFAULT_USER_PROFILE = {
  fullName: "",
  phoneNumber: "",
  email: "",
  city: "",
  defaultAddress: "",
};

export const getUserProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_USER_PROFILE };
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PROFILE,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch (error) {
    console.error("Error loading user profile:", error);
    return { ...DEFAULT_USER_PROFILE };
  }
};

export const saveUserProfile = async (profileData) => {
  try {
    const fullName = String(profileData?.fullName || "").trim();
    const phoneNumber = String(profileData?.phoneNumber || "").trim();
    const email = String(profileData?.email || "").trim();
    const city = String(profileData?.city || "").trim();
    const defaultAddress = String(profileData?.defaultAddress || "").trim();

    if (!fullName || !phoneNumber) {
      throw new Error("Full name and phone number are required.");
    }

    const cleanedProfile = {
      fullName,
      phoneNumber,
      email,
      city,
      defaultAddress,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      USER_PROFILE_STORAGE_KEY,
      JSON.stringify(cleanedProfile)
    );

    return cleanedProfile;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

export const hasSeenWelcome = async () => {
  try {
    const value = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error reading welcome flag:", error);
    return false;
  }
};

export const markWelcomeSeen = async () => {
  try {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, "true");
    return true;
  } catch (error) {
    console.error("Error saving welcome flag:", error);
    return false;
  }
};

export const resetWelcomeSeen = async () => {
  try {
    await AsyncStorage.removeItem(WELCOME_SEEN_KEY);
    return true;
  } catch (error) {
    console.error("Error resetting welcome flag:", error);
    return false;
  }
};