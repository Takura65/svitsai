import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildFallbackSummary(
  parcel: Record<string, any>,
  history: Record<string, any>[],
  checkpoints: Record<string, any>[],
  handovers: Record<string, any>[]
): string {
  const latestHistory = history[0];
  const latestCheckpoint = checkpoints[0];
  const latestHandover = handovers[0];

  const lines = [
    `Parcel ${parcel.id} (${parcel.description}) is currently "${parcel.status}" heading to ${parcel.collection_point} in ${parcel.destination_town}.`,
  ];

  if (latestCheckpoint) {
    lines.push(
      `Latest transit checkpoint: ${latestCheckpoint.location} — ${latestCheckpoint.note}.`
    );
  } else if (latestHandover) {
    lines.push(
      `Handed over to transport partner ${latestHandover.partner}.`
    );
  } else if (latestHistory?.note) {
    lines.push(`Latest update: ${latestHistory.note}`);
  }

  if (parcel.status === "Ready for Collection") {
    lines.push(
      `It is ready for pickup at ${parcel.collection_point}. Please bring the 6-digit collection code to verify pickup.`
    );
  } else if (parcel.status === "Collected") {
    lines.push(`This parcel has already been collected.`);
  }

  return lines.join(" ");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    const { trackingCode, question } = await req.json();
    const cleanCode = String(trackingCode || "").trim().toUpperCase();
    const userQuestion =
      String(question || "").trim() ||
      "Give me a clear update on where this parcel is and what happens next.";

    if (!cleanCode) {
      return jsonResponse(
        { error: "A valid parcel tracking code is required." },
        400
      );
    }

    if (userQuestion.length > 300) {
      return jsonResponse(
        { error: "Please keep your question under 300 characters." },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // User-scoped client: preserves RLS policies for customer vs. staff access
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Exclude collection_code so the PIN never enters Edge Function memory
    const { data: parcel, error: parcelError } = await supabase
      .from("parcels")
      .select(
        "id, status, destination_town, collection_point, description, quantity, collected_at, created_at, updated_at"
      )
      .eq("id", cleanCode)
      .maybeSingle();

    if (parcelError) {
      console.error("Parcel fetch error:", parcelError.message);
      return jsonResponse(
        { error: "Unable to verify parcel reference." },
        400
      );
    }

    if (!parcel) {
      return jsonResponse(
        {
          error:
            "Parcel not found or you do not have permission to view this reference.",
        },
        404
      );
    }

    // Exclude driver contact_person and vehicle_details from context
    const [historyRes, checkpointsRes, handoversRes] = await Promise.all([
      supabase
        .from("parcel_status_history")
        .select("status, note, recorded_at")
        .eq("parcel_id", cleanCode)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("transport_checkpoints")
        .select("location, note, recorded_at")
        .eq("parcel_id", cleanCode)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("transport_handovers")
        .select("partner, notes, handed_over_at")
        .eq("parcel_id", cleanCode)
        .order("handed_over_at", { ascending: false }),
    ]);

    const history = historyRes.data ?? [];
    const checkpoints = checkpointsRes.data ?? [];
    const handovers = handoversRes.data ?? [];

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return jsonResponse({
        trackingCode: cleanCode,
        status: parcel.status,
        answer: buildFallbackSummary(parcel, history, checkpoints, handovers),
        source: "rule-summary",
      });
    }

    const parcelContext = {
      tracking_code: parcel.id,
      current_status: parcel.status,
      destination_town: parcel.destination_town,
      collection_point: parcel.collection_point,
      description: parcel.description,
      quantity: parcel.quantity,
      requires_collection_pin: parcel.status === "Ready for Collection",
      collected_at: parcel.collected_at,
      status_history: history,
      transit_checkpoints: checkpoints,
      transport_handovers: handovers,
    };

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content: `You are Ask Svitsai, a concise parcel logistics assistant.
STRICT RULES:
1. Answer ONLY using facts explicitly present in the provided Parcel Data JSON.
2. NEVER quote, estimate, or mention shipping rates, fees, or refunds. If asked about pricing or fees, reply: "I can only provide live tracking updates. Please check the Send Parcel screen or contact support for pricing."
3. NEVER predict or guarantee delivery arrival times or dates. State only recorded checkpoints and current status.
4. NEVER invent or reveal a 6-digit collection PIN. If current_status is "Ready for Collection", remind the user to bring their 6-digit PIN to the destination collection point.
5. Keep responses under 4 short sentences.`,
          },
          {
            role: "user",
            content: `Question: ${userQuestion}\n\nParcel Data:\n${JSON.stringify(
              parcelContext
            )}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      return jsonResponse({
        trackingCode: cleanCode,
        status: parcel.status,
        answer: buildFallbackSummary(parcel, history, checkpoints, handovers),
        source: "fallback-summary",
      });
    }

    const aiData = await aiResponse.json();
    const answer =
      aiData?.choices?.[0]?.message?.content?.trim() ||
      buildFallbackSummary(parcel, history, checkpoints, handovers);

    return jsonResponse({
      trackingCode: cleanCode,
      status: parcel.status,
      answer,
      source: "ai",
    });
  } catch (err) {
    console.error("Ask Svitsai unhandled error:", err);
    return jsonResponse(
      { error: "Unexpected server error. Please try again." },
      500
    );
  }
});