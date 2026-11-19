import AsyncStorage from "@react-native-async-storage/async-storage";

const TRANSPORT_PARTNERS_KEY = "@svitsai_transport_partners";

// GET ALL TRANSPORT PARTNERS
export const getTransportPartners = async () => {
  try {
    const stored = await AsyncStorage.getItem(TRANSPORT_PARTNERS_KEY);

    if (!stored) return [];

    const partners = JSON.parse(stored);

    return Array.isArray(partners) ? partners : [];
  } catch (error) {
    console.error("Error retrieving transport partners:", error);
    throw error;
  }
};

// SAVE TRANSPORT PARTNERS
const saveTransportPartners = async (partners) => {
  await AsyncStorage.setItem(
    TRANSPORT_PARTNERS_KEY,
    JSON.stringify(partners)
  );
};

// ADD TRANSPORT PARTNER
export const addTransportPartner = async (partnerData) => {
  try {
    const partners = await getTransportPartners();

    const companyName = partnerData.companyName?.trim();
    const contactPerson = partnerData.contactPerson?.trim();
    const contactNumber = partnerData.contactNumber?.trim();

    if (!companyName || !contactPerson || !contactNumber) {
      throw new Error(
        "Company name, contact person and contact number are required."
      );
    }

    const duplicate = partners.some(
      (partner) =>
        partner.companyName?.toLowerCase() === companyName.toLowerCase()
    );

    if (duplicate) {
      throw new Error("This transport company already exists.");
    }

    const now = new Date().toISOString();

    const newPartner = {
      id: `TP-${Date.now()}`,
      companyName,
      contactPerson,
      contactNumber,
      email: partnerData.email?.trim() || "",
      vehicleDetails: partnerData.vehicleDetails?.trim() || "",
      vehicleRegistration: partnerData.vehicleRegistration?.trim() || "",
      address: partnerData.address?.trim() || "",
      notes: partnerData.notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    const updatedPartners = [newPartner, ...partners];
    await saveTransportPartners(updatedPartners);

    return newPartner;
  } catch (error) {
    console.error("Add transport partner error:", error);
    throw error;
  }
};

// UPDATE TRANSPORT PARTNER
export const updateTransportPartner = async (partnerId, updatedDetails) => {
  try {
    const partners = await getTransportPartners();

    const index = partners.findIndex((partner) => partner.id === partnerId);

    if (index === -1) {
      throw new Error("Transport partner not found.");
    }

    const companyName = updatedDetails.companyName?.trim();
    const contactPerson = updatedDetails.contactPerson?.trim();
    const contactNumber = updatedDetails.contactNumber?.trim();

    if (!companyName || !contactPerson || !contactNumber) {
      throw new Error(
        "Company name, contact person and contact number are required."
      );
    }

    const duplicate = partners.some(
      (partner, i) =>
        i !== index &&
        partner.companyName?.toLowerCase() === companyName.toLowerCase()
    );

    if (duplicate) {
      throw new Error("Another transport company already uses this name.");
    }

    const updatedPartner = {
      ...partners[index],
      companyName,
      contactPerson,
      contactNumber,
      email: updatedDetails.email?.trim() || "",
      vehicleDetails: updatedDetails.vehicleDetails?.trim() || "",
      vehicleRegistration: updatedDetails.vehicleRegistration?.trim() || "",
      address: updatedDetails.address?.trim() || "",
      notes: updatedDetails.notes?.trim() || "",
      id: partnerId,
      updatedAt: new Date().toISOString(),
    };

    const updatedPartners = partners.map((partner, i) =>
      i === index ? updatedPartner : partner
    );

    await saveTransportPartners(updatedPartners);

    return updatedPartner;
  } catch (error) {
    console.error("Update transport partner error:", error);
    throw error;
  }
};

// DELETE TRANSPORT PARTNER
export const deleteTransportPartner = async (partnerId) => {
  try {
    const partners = await getTransportPartners();

    const updatedPartners = partners.filter(
      (partner) => partner.id !== partnerId
    );

    if (updatedPartners.length === partners.length) {
      throw new Error("Transport partner not found.");
    }

    await saveTransportPartners(updatedPartners);

    return updatedPartners;
  } catch (error) {
    console.error("Delete transport partner error:", error);
    throw error;
  }
};

// GET ONE TRANSPORT PARTNER
export const getTransportPartnerById = async (partnerId) => {
  const partners = await getTransportPartners();

  return partners.find((partner) => partner.id === partnerId) || null;
};