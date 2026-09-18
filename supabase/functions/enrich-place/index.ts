import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Point = { lat: number; lon: number };

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

    const prompt = `Busca y verifica información pública actual sobre este lugar para una guía digital de huéspedes.\n\nLugar: ${placeName}\nCiudad: ${placeCity}\nAlojamiento de referencia: ${property.name || ""}\nDirección del alojamiento: ${property.address || ""}\nCiudad del alojamiento: ${property.city || ""}\nPaís: ${property.country || ""}\n\nIdentifica el establecimiento/lugar correcto. No inventes datos. Si un dato no se puede verificar, usa una cadena vacía. La descripción debe ser breve, útil, neutral y en español. Devuelve una dirección postal completa siempre que puedas verificarla. El rango de precios solo cuando sea aplicable. Para distance y mapUrl puedes devolver cadena vacía: el backend intentará completarlos automáticamente a partir de las direcciones verificadas. Devuelve exclusivamente los campos del esquema solicitado.`;

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

    const destinationQuery = String(
      enriched.address || `${enriched.name || placeName}, ${enriched.city || placeCity}`
    ).trim();

    if (destinationQuery) {
      enriched.mapUrl = buildGoogleMapsUrl(destinationQuery);
    }

    if (property.address && destinationQuery) {
      const originCandidates = unique([
        [property.address, property.city, property.country].filter(Boolean).join(", "),
        String(property.address || ""),
        [simplifyAddress(property.address), property.city, property.country].filter(Boolean).join(", "),
        [simplifyAddress(property.address), property.city].filter(Boolean).join(", "),
      ]);
      const destinationCandidates = unique([
        destinationQuery,
        [simplifyAddress(enriched.address), enriched.city || placeCity, property.country].filter(Boolean).join(", "),
        [enriched.name || placeName, enriched.city || placeCity].filter(Boolean).join(", "),
        [placeName, placeCity].filter(Boolean).join(", "),
      ]);

      try {
        const [origin, destination] = await Promise.all([
          geocodeFirst(originCandidates, "origin"),
          geocodeFirst(destinationCandidates, "destination"),
        ]);

        if (origin && destination) {
          enriched.distance = await routeDistance(origin, destination) || straightLineDistance(origin, destination);
          console.log("Distance enrichment ok", { distance: enriched.distance });
        } else {
          console.warn("Distance coordinates unavailable", {
            originFound: Boolean(origin),
            destinationFound: Boolean(destination),
            originCandidates,
            destinationCandidates,
          });
        }
      } catch (distanceError) {
        console.warn("Distance enrichment failed", distanceError);
      }
    } else {
      console.warn("Distance skipped", {
        hasPropertyAddress: Boolean(property.address),
        hasDestinationQuery: Boolean(destinationQuery),
      });
    }

    return json(enriched, 200);
  } catch (error) {
    console.error(error);
    return json({ error: "enrich_place_failed", detail: String(error?.message || error) }, 500);
  }
});

function buildGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function unique(values: string[]) {
  return [...new Set(values.map(v => String(v || "").trim()).filter(Boolean))];
}

function simplifyAddress(value: unknown) {
  return String(value || "")
    .replace(/\b(piso|planta|puerta|portal|bloque|apto\.?|apartamento)\b[^,]*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*,+/g, ",")
    .replace(/^\s*,|,\s*$/g, "")
    .trim();
}

async function geocodeFirst(candidates: string[], label: string): Promise<Point | null> {
  for (const query of candidates) {
    const point = await geocode(query);
    if (point) {
      console.log("Geocode matched", { label, query });
      return point;
    }
    console.warn("Geocode miss", { label, query });
  }
  return null;
}

function normalizeGeoText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9, ]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

async function geocode(query: string): Promise<Point | null> {
  if (!query.trim()) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=es&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Accept-Language": "es",
      "User-Agent": "UrbanStayPlatform/1.0 (contact: support@urban-stay-platform.com)",
    },
  });

  if (!response.ok) {
    console.warn("Geocode HTTP error", { status: response.status, query });
    return null;
  }
  const rows = await response.json();
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return { lat: Number(first.lat), lon: Number(first.lon) };
}

async function routeDistance(origin: Point, destination: Point): Promise<string> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn("OSRM HTTP error", { status: response.status });
    return "";
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route?.distance) return "";

  const km = Number(route.distance) / 1000;
  const minutes = route.duration ? Math.max(1, Math.round(Number(route.duration) / 60)) : null;
  const kmText = km < 1 ? `${Math.round(km * 1000)} m` : `${formatKm(km)} km`;

  return minutes ? `${kmText} · ${minutes} min en coche` : kmText;
}

function straightLineDistance(origin: Point, destination: Point): string {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.lon - origin.lon);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(destination.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const km = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (!Number.isFinite(km)) return "";
  return km < 1 ? `${Math.round(km * 1000)} m aprox.` : `${formatKm(km)} km aprox.`;
}

function formatKm(km: number) {
  return km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}