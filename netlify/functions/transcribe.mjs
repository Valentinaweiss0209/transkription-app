export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");
    const apiKey = formData.get("api_key");
    const language = formData.get("language") || "de";

    if (!audioFile || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Datei und API-Key sind erforderlich." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // File-Größe prüfen (Netlify Function Limit ~20MB)
    const fileSize = audioFile.size;
    if (fileSize > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          error: `Datei zu groß (${(fileSize / 1024 / 1024).toFixed(1)} MB). Maximum: 20 MB pro Chunk.`,
        }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", audioFile, audioFile.name || "audio.mp3");
    groqForm.append("model", "whisper-large-v3");
    if (language) {
      groqForm.append("language", language);
    }
    groqForm.append("response_format", "verbose_json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Groq API Fehler (${response.status}): ${responseText}`,
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sicherstellen dass die Antwort gültiges JSON ist
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Groq hat eine ungültige Antwort gesendet.",
          raw: responseText.substring(0, 500),
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Server-Fehler: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/transcribe",
};
