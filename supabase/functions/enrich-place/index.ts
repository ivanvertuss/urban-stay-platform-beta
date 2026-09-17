import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const body = await req.json();
    const property = body?.property || {};
    const place = body?.place || {};
    const placeName = String(place?.name || "").trim();
    const placeCity = String(place?.city || property?.city || "").trim();

    if (!placeName || !placeCity) {
      console.error("Missing place data", {
        hasName: Boolean(placeName),
        hasPlaceCity: Boolean(place?.city),
        hasPropertyCity: Boolean(property?.city),
      });
      return json({ error: "name_and_city_required" }, 400);
    }

    const prompt = `Busca y verifica información pública actual sobre este lugar para una guía digital de huéspedes.\n\nLugar: ${placeName}\nCiudad: ${placeCity}\nAlojamiento de referencia: ${property.name || ""}\nDirección del alojamiento: ${property.address || ""}\nCiudad del alojamiento: ${property.city || ""}\nPaís: ${property.country || ""}\n\nIdentifica el establecimiento/lugar correcto. No inventes datos. Si un dato no se puede verificar, usa una cadena vacía. La descripción debe ser breve, útil, neutral y en español. La distancia debe ser desde el alojamiento cuando la dirección del alojamiento permita calcularla razonablemente. El rango de precios solo cuando sea aplicable. Devuelve exclusivamente los campos del esquema solicitado.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        tools: [{ type: "web_search" }],
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "place_enrichment",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                city: { type: "string" },
                type: { type: "string", enum: ["Restaurante", "Cafetería", "Playa", "Lugar de interés", "Compras", "Servicio", "Otro"] },
                description: { type: "string" },
                address: { type: "string" },
                distance: { type: "string" },
                price: { type: "string" },
                hours: { type: "string" },
                phone: { type: "string" },
                website: { type: "string" },
                mapUrl: { type: "string" },
                imageUrl: { type: "string" }
              },
              required: ["name", "city", "type", "description", "address", "distance", "price", "hours", "phone", "website", "mapUrl", "imageUrl"]
            }
          }
        }
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("OpenAI error", result);
      return json({ error: "openai_request_failed", detail: result?.error?.message || "Unknown error" }, 502);
    }

    const text = result?.output_text || result?.output?.flatMap((o: any) => o?.content || []).find((c: any) => c?.type === "output_text")?.text;
    if (!text) return json({ error: "empty_ai_response" }, 502);

    const enriched = JSON.parse(text);
    if (!enriched.city) enriched.city = placeCity;
    if (!enriched.name) enriched.name = placeName;
    return json(enriched, 200);
  } catch (error) {
    console.error(error);
    return json({ error: "enrich_place_failed", detail: String(error?.message || error) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}