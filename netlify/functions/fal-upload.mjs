export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { api_key, file_name, content_type } = await req.json();

    if (!api_key || !file_name) {
      return new Response(
        JSON.stringify({ error: "api_key und file_name sind erforderlich" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Debug: Key-Info loggen
    const keyLen = api_key.length;
    const keyStart = api_key.substring(0, 8);
    const keyEnd = api_key.substring(api_key.length - 4);
    const hasColon = api_key.includes(":");
    console.log(`fal key debug: len=${keyLen} start=${keyStart} end=${keyEnd} colon=${hasColon}`);

    const response = await fetch(
      "https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name,
          content_type: content_type || "audio/mp4",
        }),
      }
    );

    const data = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data,
          debug: { keyLen, keyStart, keyEnd, hasColon },
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(data, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/fal-upload",
};
