import { supabase } from "../lib/supabase";
import { getParcelById } from "./parcelStorage";

function buildLocalOfflineAnswer(parcel) {
  if (!parcel) {
    return "Parcel details could not be loaded offline. Please reconnect and try again.";
  }

  const latestCheckpoint = parcel.checkpoints?.[0];
  const latestHistory = parcel.statusHistory?.[0];

  const parts = [
    `Parcel ${parcel.id} is currently "${parcel.status}" for pickup at ${parcel.collectionPoint} (${parcel.destinationTown}).`,
  ];

  if (latestCheckpoint) {
    parts.push(
      `Last recorded checkpoint: ${latestCheckpoint.location} — ${latestCheckpoint.note}.`
    );
  } else if (latestHistory?.note) {
    parts.push(`Latest update: ${latestHistory.note}`);
  }

  if (parcel.status === "Ready for Collection" && parcel.collectionCode) {
    parts.push(
      `Use 6-digit collection code ${parcel.collectionCode} at ${parcel.collectionPoint} to complete pickup.`
    );
  }

  return parts.join(" ");
}

export async function askSvitsaiAboutParcel(trackingCode, question = "") {
  const cleanCode = String(trackingCode || "").trim().toUpperCase();
  if (!cleanCode) {
    throw new Error("Enter a parcel reference (e.g., SVT-123456789) first.");
  }

  const { data, error } = await supabase.functions.invoke("ask-svitsai", {
    body: {
      trackingCode: cleanCode,
      question: String(question || "").trim(),
    },
  });

  if (!error && data?.answer) {
    return {
      trackingCode: cleanCode,
      status: data.status || "Unknown",
      answer: data.answer,
      source: data.source || "ai",
    };
  }

  // Graceful fallback to local/cached parcel data if Edge Function is unreachable
  const cachedParcel = await getParcelById(cleanCode);
  if (!cachedParcel) {
    throw new Error(
      data?.error ||
        error?.message ||
        "Unable to summarize parcel status right now."
    );
  }

  return {
    trackingCode: cleanCode,
    status: cachedParcel.status,
    answer: buildLocalOfflineAnswer(cachedParcel),
    source: "offline-cache",
  };
}