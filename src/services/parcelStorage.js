import { supabase } from "../lib/supabase";

export const PARCEL_STATUSES = [
  "Registered",
  "Awaiting Collection",
  "In Transit",
  "Ready for Collection",
  "Collected",
];

const STATUS_INDEX = Object.fromEntries(
  PARCEL_STATUSES.map((status, index) => [status, index])
);

function generateParcelId() {
  const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
  return `SVT-${randomDigits}`;
}

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateEventId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
}

async function requireAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user?.id;
  if (!userId) {
    throw new Error("Sign in to access your parcel account.");
  }
  return userId;
}

function formatNotification(row) {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    trackingCode: row.tracking_code,
    recipientName: row.recipient_name || "",
    senderName: row.sender_name || "",
    status: row.status,
    message: row.message,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

function formatParcel(parcelRow, related = {}) {
  const historyRows = related.statusHistory || [];
  const handoverRows = related.handovers || [];
  const checkpointRows = related.checkpoints || [];

  const statusHistory = historyRows.map((h) => ({
    id: h.id,
    parcelId: h.parcel_id,
    status: h.status,
    note: h.note || "",
    recordedAt: h.recorded_at,
    timestamp: h.recorded_at,
  }));

  const handoverHistory = handoverRows.map((ho) => ({
    id: ho.id,
    parcelId: ho.parcel_id,
    partner: ho.partner,
    contactPerson: ho.contact_person,
    contactNumber: ho.contact_number || "",
    vehicleDetails: ho.vehicle_details || "",
    notes: ho.notes || "",
    handedOverAt: ho.handed_over_at,
  }));

  const checkpoints = checkpointRows.map((cp) => ({
    id: cp.id,
    parcelId: cp.parcel_id,
    location: cp.location,
    note: cp.note || "",
    recordedAt: cp.recorded_at,
    timestamp: cp.recorded_at,
  }));

  return {
    id: parcelRow.id,
    trackingCode: parcelRow.id,
    status: parcelRow.status,
    senderName: parcelRow.sender_name,
    senderPhone: parcelRow.sender_phone,
    sender: {
      fullName: parcelRow.sender_name,
      phone: parcelRow.sender_phone,
    },
    recipientName: parcelRow.recipient_name,
    recipientPhone: parcelRow.recipient_phone,
    recipient: {
      fullName: parcelRow.recipient_name,
      phone: parcelRow.recipient_phone,
    },
    destinationTown: parcelRow.destination_town,
    collectionPoint: parcelRow.collection_point,
    destination: {
      town: parcelRow.destination_town,
      collectionPoint: parcelRow.collection_point,
    },
    description: parcelRow.description,
    quantity: Number(parcelRow.quantity ?? 1),
    estimatedValueUsd: Number(parcelRow.estimated_value_usd ?? 0),
    parcel: {
      description: parcelRow.description,
      quantity: Number(parcelRow.quantity ?? 1),
      estimatedValueUSD: Number(parcelRow.estimated_value_usd ?? 0),
    },
    collectionCode: parcelRow.collection_code || null,
    collectedAt: parcelRow.collected_at || null,
    createdAt: parcelRow.created_at,
    updatedAt: parcelRow.updated_at,
    statusHistory,
    transportHandover: handoverHistory[0] || null,
    handoverHistory,
    checkpoints,
  };
}

async function insertNotificationRow({
  parcelId = null,
  trackingCode,
  recipientName = "",
  senderName = "",
  status = "Update",
  message,
}) {
  const id = generateEventId("NTF");
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      id,
      parcel_id: parcelId,
      tracking_code: String(trackingCode || "").trim().toUpperCase(),
      recipient_name: recipientName,
      sender_name: senderName,
      status,
      message,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("[insertNotificationRow] error:", error);
    throw error;
  }
  return formatNotification(data);
}

async function hydrateParcelRows(parcelRows) {
  if (!parcelRows || parcelRows.length === 0) {
    return [];
  }

  const ids = parcelRows.map((p) => p.id);

  const [historyRes, handoversRes, checkpointsRes] = await Promise.all([
    supabase
      .from("parcel_status_history")
      .select("*")
      .in("parcel_id", ids)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false }),
    supabase
      .from("transport_handovers")
      .select("*")
      .in("parcel_id", ids)
      .order("handed_over_at", { ascending: false })
      .order("id", { ascending: false }),
    supabase
      .from("transport_checkpoints")
      .select("*")
      .in("parcel_id", ids)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  if (historyRes.error) throw historyRes.error;
  if (handoversRes.error) throw handoversRes.error;
  if (checkpointsRes.error) throw checkpointsRes.error;

  const groupByParcel = (rows) => {
    const map = new Map();
    for (const row of rows || []) {
      if (!map.has(row.parcel_id)) {
        map.set(row.parcel_id, []);
      }
      map.get(row.parcel_id).push(row);
    }
    return map;
  };

  const historyMap = groupByParcel(historyRes.data);
  const handoversMap = groupByParcel(handoversRes.data);
  const checkpointsMap = groupByParcel(checkpointsRes.data);

  return parcelRows.map((row) =>
    formatParcel(row, {
      statusHistory: historyMap.get(row.id) || [],
      handovers: handoversMap.get(row.id) || [],
      checkpoints: checkpointsMap.get(row.id) || [],
    })
  );
}

async function fetchRawParcelById(rawId) {
  const cleanId = String(rawId || "").trim().toUpperCase();
  if (!cleanId) return null;

  const { data, error } = await supabase
    .from("parcels")
    .select("*")
    .eq("id", cleanId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function syncParcelsCacheFromSupabase() {
  const { data, error } = await supabase
    .from("parcels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const freshParcels = await hydrateParcelRows(data || []);
  return freshParcels;
}

async function syncNotificationsCacheFromSupabase() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;

  const freshNotifications = (data || []).map(formatNotification);
  return freshNotifications;
}

export async function getParcels() {
  return syncParcelsCacheFromSupabase();
}

export async function getParcelById(id) {
  const cleanId = String(id || "").trim().toUpperCase();
  if (!cleanId) return null;

  const rawRow = await fetchRawParcelById(cleanId);
  if (!rawRow) return null;

  const [parcel] = await hydrateParcelRows([rawRow]);
  return parcel || null;
}

export async function createParcel(parcelInput) {
  const ownerId = await requireAuthenticatedUserId();
  const senderName = String(
    parcelInput?.senderName ||
      parcelInput?.sender?.fullName ||
      parcelInput?.sender_name ||
      ""
  ).trim();
  const senderPhone = String(
    parcelInput?.senderPhone ||
      parcelInput?.sender?.phone ||
      parcelInput?.sender_phone ||
      ""
  ).trim();
  const recipientName = String(
    parcelInput?.recipientName ||
      parcelInput?.recipient?.fullName ||
      parcelInput?.recipient_name ||
      ""
  ).trim();
  const recipientPhone = String(
    parcelInput?.recipientPhone ||
      parcelInput?.recipient?.phone ||
      parcelInput?.recipient_phone ||
      ""
  ).trim();
  const destinationTown = String(
    parcelInput?.destinationTown ||
      parcelInput?.destination?.town ||
      parcelInput?.destination_town ||
      ""
  ).trim();
  const collectionPoint = String(
    parcelInput?.collectionPoint ||
      parcelInput?.destination?.collectionPoint ||
      parcelInput?.collection_point ||
      ""
  ).trim();
  const description = String(parcelInput?.description || "").trim();
  const quantity = Number(parcelInput?.quantity ?? 1);
  const estimatedValueUsd = Number(
    parcelInput?.estimatedValueUsd ?? parcelInput?.estimated_value_usd ?? 0
  );

  if (
    !senderName ||
    !senderPhone ||
    !recipientName ||
    !recipientPhone ||
    !destinationTown ||
    !collectionPoint ||
    !description
  ) {
    throw new Error(
      "Sender details, recipient details, destination town, collection point, and description are required."
    );
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }

  if (Number.isNaN(estimatedValueUsd) || estimatedValueUsd < 0) {
    throw new Error("Estimated value in USD cannot be negative.");
  }

  let parcelId = generateParcelId();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await fetchRawParcelById(parcelId);
    if (!existing) break;
    parcelId = generateParcelId();
  }

  const initialStatus = "Registered";

  const { data: createdRow, error: insertError } = await supabase
    .from("parcels")
    .insert({
      id: parcelId,
      owner_id: ownerId,
      status: initialStatus,
      sender_name: senderName,
      sender_phone: senderPhone,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      destination_town: destinationTown,
      collection_point: collectionPoint,
      description,
      quantity,
      estimated_value_usd: estimatedValueUsd,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  await syncParcelsCacheFromSupabase().catch(() => {});
  await syncNotificationsCacheFromSupabase().catch(() => {});

  const [created] = await hydrateParcelRows([createdRow]);
  return created;
}

export async function saveParcel(parcelData) {
  return createParcel({
    senderName: parcelData?.sender?.fullName,
    senderPhone: parcelData?.sender?.phone,
    recipientName: parcelData?.recipient?.fullName,
    recipientPhone: parcelData?.recipient?.phone,
    destinationTown: parcelData?.destination?.town,
    collectionPoint: parcelData?.destination?.collectionPoint,
    description: parcelData?.parcel?.description,
    quantity: parcelData?.parcel?.quantity,
    estimatedValueUsd: parcelData?.parcel?.estimatedValueUSD,
  });
}

export async function updateParcelStatus(id, status, note = "") {
  const nextStatus = String(status || "").trim();
  if (!PARCEL_STATUSES.includes(nextStatus)) {
    throw new Error(
      `Invalid status "${nextStatus}". Must be one of: ${PARCEL_STATUSES.join(", ")}.`
    );
  }

  const current = await fetchRawParcelById(id);
  if (!current) {
    throw new Error("Parcel not found.");
  }

  const cleanId = String(current.id || "").trim().toUpperCase();
  if (!cleanId) {
    throw new Error("Parcel reference ID is missing.");
  }

  const currentIndex = STATUS_INDEX[current.status];
  const nextIndex = STATUS_INDEX[nextStatus];

  if (nextIndex < currentIndex) {
    throw new Error(
      `Cannot move parcel backward from "${current.status}" to "${nextStatus}".`
    );
  }

  const needsCodeRepair =
    current.status === "Ready for Collection" &&
    nextStatus === "Ready for Collection" &&
    !current.collection_code;

  if (nextIndex === currentIndex && !needsCodeRepair) {
    throw new Error(`Parcel is already in "${current.status}" status.`);
  }

  let collectionCode = current.collection_code;
  if (nextStatus === "Ready for Collection" && !collectionCode) {
    collectionCode = generateSixDigitCode();
  }

  const collectedAt =
    nextStatus === "Collected"
      ? current.collected_at || new Date().toISOString()
      : current.collected_at;

  console.log("[updateParcelStatus] step 1: update parcels", {
    cleanId,
    nextStatus,
    collectionCode,
  });

  const { data: updatedRow, error: updateError } = await supabase
    .from("parcels")
    .update({
      status: nextStatus,
      collection_code: collectionCode,
      collected_at: collectedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cleanId)
    .select()
    .single();

  if (updateError) {
    console.error("[updateParcelStatus] step 1 failed:", updateError);
    throw updateError;
  }

  const cleanNote = String(note || "").trim();
  const historyNote =
    cleanNote ||
    (nextStatus === "Ready for Collection" && collectionCode
      ? `Status updated to Ready for Collection. Collection code ${collectionCode} generated.`
      : `Status updated from ${current.status} to ${nextStatus}.`);

  console.log("[updateParcelStatus] step 2: insert parcel_status_history", {
    cleanId,
    nextStatus,
  });

  const { error: historyError } = await supabase
    .from("parcel_status_history")
    .insert({
      parcel_id: cleanId,
      status: nextStatus,
      note: historyNote,
    });

  if (historyError) {
    console.error("[updateParcelStatus] step 2 failed:", historyError);
    throw historyError;
  }

  const notifMessage =
    nextStatus === "Ready for Collection" && collectionCode
      ? `Parcel ${cleanId} is Ready for Collection at ${current.collection_point}. Collection code: ${collectionCode}.`
      : `Parcel ${cleanId} status updated to ${nextStatus}.`;

  console.log("[updateParcelStatus] step 3: insert notification", {
    cleanId,
    nextStatus,
  });

  await insertNotificationRow({
    parcelId: cleanId,
    trackingCode: cleanId,
    recipientName: current.recipient_name,
    senderName: current.sender_name,
    status: nextStatus,
    message: notifMessage,
  });

  console.log("[updateParcelStatus] step 4: sync caches & hydrate", { cleanId });

  await syncParcelsCacheFromSupabase().catch(() => {});
  await syncNotificationsCacheFromSupabase().catch(() => {});

  const [updated] = await hydrateParcelRows([updatedRow]);
  return updated;
}

export async function recordTransportHandover(id, handoverData = {}) {
  const partner = String(handoverData.partner || "").trim();
  const contactPerson = String(
    handoverData.contactPerson || handoverData.contact_person || ""
  ).trim();
  const contactNumber = String(
    handoverData.contactNumber || handoverData.contact_number || ""
  ).trim();
  const vehicleDetails = String(
    handoverData.vehicleDetails || handoverData.vehicle_details || ""
  ).trim();
  const notes = String(handoverData.notes || "").trim();

  if (!partner || !contactPerson) {
    throw new Error("Transport partner and contact person are required.");
  }

  const current = await fetchRawParcelById(id);
  if (!current) {
    throw new Error("Parcel not found.");
  }

  if (STATUS_INDEX[current.status] >= STATUS_INDEX["Ready for Collection"]) {
    throw new Error(
      `Cannot record handover once parcel is "${current.status}".`
    );
  }

  const handoverId = generateEventId("HND");
  const { error: handoverError } = await supabase
    .from("transport_handovers")
    .insert({
      id: handoverId,
      parcel_id: current.id,
      partner,
      contact_person: contactPerson,
      contact_number: contactNumber,
      vehicle_details: vehicleDetails,
      notes,
    });

  if (handoverError) throw handoverError;

  const targetStatus = "In Transit";
  const { data: updatedRow, error: updateError } = await supabase
    .from("parcels")
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select()
    .single();

  if (updateError) throw updateError;

  const { error: historyError } = await supabase
    .from("parcel_status_history")
    .insert({
      parcel_id: current.id,
      status: targetStatus,
      note: `Handed over to ${partner} (${contactPerson})${vehicleDetails ? ` [${vehicleDetails}]` : ""}.`,
    });

  if (historyError) throw historyError;

  await insertNotificationRow({
    parcelId: current.id,
    trackingCode: current.id,
    recipientName: current.recipient_name,
    senderName: current.sender_name,
    status: targetStatus,
    message: `Parcel ${current.id} handed over to ${partner} and is now In Transit.`,
  });

  await syncParcelsCacheFromSupabase().catch(() => {});
  await syncNotificationsCacheFromSupabase().catch(() => {});

  const [updated] = await hydrateParcelRows([updatedRow]);
  return updated;
}

export async function addTransportCheckpoint(id, checkpointData = {}) {
  const location = String(checkpointData.location || "").trim();
  const note = String(checkpointData.note || "").trim();

  if (!location || !note) {
    throw new Error("Checkpoint location and note are required.");
  }

  const current = await fetchRawParcelById(id);
  if (!current) {
    throw new Error("Parcel not found.");
  }

  if (current.status === "Collected") {
    throw new Error("Cannot add checkpoints to a collected parcel.");
  }

  const checkpointId = generateEventId("CHK");
  const { error: checkpointError } = await supabase
    .from("transport_checkpoints")
    .insert({
      id: checkpointId,
      parcel_id: current.id,
      location,
      note,
    });

  if (checkpointError) throw checkpointError;

  const { data: updatedRow, error: updateError } = await supabase
    .from("parcels")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select()
    .single();

  if (updateError) throw updateError;

  await syncParcelsCacheFromSupabase().catch(() => {});

  const [updated] = await hydrateParcelRows([updatedRow]);
  return updated;
}

export async function verifyParcelCollection(id, code) {
  const submittedCode = String(code || "").trim();
  if (!/^\d{6}$/.test(submittedCode)) {
    throw new Error("Collection code must be a 6-digit numeric code.");
  }

  const current = await fetchRawParcelById(id);
  if (!current) {
    throw new Error("Parcel not found.");
  }

  if (current.status === "Collected") {
    throw new Error("This parcel has already been collected.");
  }

  if (current.status !== "Ready for Collection") {
    throw new Error(
      `Parcel cannot be collected while status is "${current.status}".`
    );
  }

  if (!current.collection_code || submittedCode !== current.collection_code) {
    throw new Error("Invalid 6-digit collection code.");
  }

  const collectedStatus = "Collected";
  const nowIso = new Date().toISOString();

  const { data: updatedRow, error: updateError } = await supabase
    .from("parcels")
    .update({
      status: collectedStatus,
      collected_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", current.id)
    .select()
    .single();

  if (updateError) throw updateError;

  const { error: historyError } = await supabase
    .from("parcel_status_history")
    .insert({
      parcel_id: current.id,
      status: collectedStatus,
      note: `Parcel collected by ${current.recipient_name} using verified 6-digit code.`,
    });

  if (historyError) throw historyError;

  await insertNotificationRow({
    parcelId: current.id,
    trackingCode: current.id,
    recipientName: current.recipient_name,
    senderName: current.sender_name,
    status: collectedStatus,
    message: `Parcel ${current.id} was collected by ${current.recipient_name} at ${current.collection_point}.`,
  });

  await syncParcelsCacheFromSupabase().catch(() => {});
  await syncNotificationsCacheFromSupabase().catch(() => {});

  const [updated] = await hydrateParcelRows([updatedRow]);
  return updated;
}

export async function getNotifications() {
  return syncNotificationsCacheFromSupabase();
}

export async function createNotification(notificationData = {}) {
  const trackingCode = String(
    notificationData.trackingCode || notificationData.tracking_code || ""
  )
    .trim()
    .toUpperCase();
  const message = String(notificationData.message || "").trim();

  if (!trackingCode || !message) {
    throw new Error("Tracking code and message are required.");
  }

  const created = await insertNotificationRow({
    parcelId: notificationData.parcelId || notificationData.parcel_id || null,
    trackingCode,
    recipientName: String(
      notificationData.recipientName || notificationData.recipient_name || ""
    ).trim(),
    senderName: String(
      notificationData.senderName || notificationData.sender_name || ""
    ).trim(),
    status: String(notificationData.status || "Update").trim(),
    message,
  });

  await syncNotificationsCacheFromSupabase().catch(() => {});
  return created;
}

export async function markNotificationRead(id, read = true) {
  const cleanId = String(id || "").trim();
  const nextRead = typeof read === "boolean" ? read : true;

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: nextRead })
    .eq("id", cleanId)
    .select()
    .single();

  if (error) throw error;

  await syncNotificationsCacheFromSupabase().catch(() => {});
  return formatNotification(data);
}

export async function markAllNotificationsRead() {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false)
    .select("id");

  if (error) throw error;

  await syncNotificationsCacheFromSupabase().catch(() => {});
  return { updatedCount: (data || []).length, read: true };
}

export async function deleteNotification(id) {
  const cleanId = String(id || "").trim();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", cleanId);

  if (error) throw error;

  await syncNotificationsCacheFromSupabase().catch(() => {});
  return { deleted: true, id: cleanId };
}