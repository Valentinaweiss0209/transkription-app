// --- State ---
let selectedFile = null;

// --- DOM ---
const providerSelect = document.getElementById("provider");
const groqKeySection = document.getElementById("groq-key-section");
const falKeySection = document.getElementById("fal-key-section");
const groqKeyInput = document.getElementById("groq-api-key");
const falKeyInput = document.getElementById("fal-api-key");
const saveGroqKeyBtn = document.getElementById("save-groq-key");
const saveFalKeyBtn = document.getElementById("save-fal-key");
const groqKeyStatus = document.getElementById("groq-key-status");
const falKeyStatus = document.getElementById("fal-key-status");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const removeFileBtn = document.getElementById("remove-file");
const languageSelect = document.getElementById("language");
const modelSelect = document.getElementById("model");
const timestampsCheckbox = document.getElementById("timestamps");
const startBtn = document.getElementById("start-btn");
const progressSection = document.getElementById("progress-section");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const resultSection = document.getElementById("result-section");
const transcript = document.getElementById("transcript");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

// --- Init: Keys laden ---
const savedGroqKey = localStorage.getItem("groq_api_key") || "";
const savedFalKey = localStorage.getItem("fal_api_key") || "";

if (savedGroqKey) {
  groqKeyInput.value = savedGroqKey;
  groqKeyStatus.textContent = "Key gespeichert";
  groqKeyStatus.className = "status-text success";
}
if (savedFalKey) {
  falKeyInput.value = savedFalKey;
  falKeyStatus.textContent = "Key gespeichert";
  falKeyStatus.className = "status-text success";
}

updateProviderUI();
updateModelOptions();
updateStartButton();

// --- Provider Switch ---
providerSelect.addEventListener("change", () => {
  updateProviderUI();
  updateModelOptions();
  updateStartButton();
});

function updateProviderUI() {
  const provider = providerSelect.value;
  groqKeySection.classList.toggle("hidden", provider !== "groq");
  falKeySection.classList.toggle("hidden", provider !== "fal");
}

function updateModelOptions() {
  const provider = providerSelect.value;
  if (provider === "fal") {
    modelSelect.innerHTML = `
      <option value="fal-ai/wizper" selected>Wizper — blitzschnell (fal.ai)</option>
      <option value="fal-ai/whisper">Whisper Large v3 (fal.ai)</option>
    `;
  } else {
    modelSelect.innerHTML = `
      <option value="whisper-large-v3" selected>Whisper Large v3 (beste Qualität)</option>
      <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo (schneller)</option>
    `;
  }
}

// --- API Keys speichern ---
saveGroqKeyBtn.addEventListener("click", () => {
  const key = groqKeyInput.value.trim();
  if (!key.startsWith("gsk_")) {
    groqKeyStatus.textContent = "Ungültiger Key — muss mit gsk_ beginnen";
    groqKeyStatus.className = "status-text error";
    return;
  }
  localStorage.setItem("groq_api_key", key);
  groqKeyStatus.textContent = "Key gespeichert";
  groqKeyStatus.className = "status-text success";
  updateStartButton();
});

saveFalKeyBtn.addEventListener("click", () => {
  const key = falKeyInput.value.trim();
  if (!key) {
    falKeyStatus.textContent = "Bitte Key eingeben";
    falKeyStatus.className = "status-text error";
    return;
  }
  // Key-Format normalisieren: Falls nur Key-ID ohne Doppelpunkt, warnen
  if (!key.includes(":") && !key.includes("-")) {
    falKeyStatus.textContent = "Key sieht unvollständig aus — bitte den vollständigen Key kopieren";
    falKeyStatus.className = "status-text error";
    return;
  }
  localStorage.setItem("fal_api_key", key);
  falKeyStatus.textContent = "Key gespeichert";
  falKeyStatus.className = "status-text success";
  updateStartButton();
});

// --- Drag & Drop ---
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    handleFile(fileInput.files[0]);
  }
});

removeFileBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInfo.classList.add("hidden");
  fileInput.value = "";
  updateStartButton();
});

function handleFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const validExts = ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "mov"];

  if (!validExts.includes(ext)) {
    alert("Dieses Dateiformat wird nicht unterstützt.\nErlaubt: MP3, MP4, M4A, WAV, OGG, WEBM");
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatSize(file.size);
  fileInfo.classList.remove("hidden");
  updateStartButton();
}

// --- Start ---
startBtn.addEventListener("click", startTranscription);

async function startTranscription() {
  if (!selectedFile) return;

  const provider = providerSelect.value;
  const apiKey = provider === "groq"
    ? (groqKeyInput.value.trim() || localStorage.getItem("groq_api_key"))
    : (falKeyInput.value.trim() || localStorage.getItem("fal_api_key"));

  if (!apiKey) return;

  startBtn.disabled = true;
  progressSection.classList.remove("hidden");
  resultSection.classList.add("hidden");

  try {
    if (provider === "fal") {
      await transcribeWithFal(apiKey);
    } else {
      await transcribeWithGroq(apiKey);
    }
  } catch (err) {
    const msg = err?.message || err?.detail || JSON.stringify(err) || "Unbekannter Fehler";
    updateProgress(0, `Fehler: ${msg}`);
    progressText.style.color = "#ef4444";
  } finally {
    startBtn.disabled = false;
  }
}

// ==========================================
// FAL.AI TRANSCRIPTION
// ==========================================

async function transcribeWithFal(apiKey) {
  const falModel = modelSelect.value;
  const language = languageSelect.value;
  const contentType = selectedFile.type || "audio/mp4";

  // Schritt 1: Upload initiieren (über Netlify Function — kein CORS-Problem)
  updateProgress(10, "Upload wird vorbereitet...");
  const initResponse = await fetch("/api/fal-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      file_name: selectedFile.name,
      content_type: contentType,
    }),
  });

  if (!initResponse.ok) {
    const errText = await initResponse.text();
    throw new Error(`Upload-Init fehlgeschlagen: ${errText}`);
  }

  const { upload_url, file_url } = await initResponse.json();

  // Schritt 2: Datei hochladen
  updateProgress(30, "Datei wird hochgeladen...");
  let uploadResponse;
  try {
    uploadResponse = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: selectedFile,
    });
  } catch (uploadErr) {
    throw new Error(`Datei-Upload Netzwerkfehler: ${uploadErr.message}`);
  }

  if (!uploadResponse.ok) {
    throw new Error(`Datei-Upload fehlgeschlagen (${uploadResponse.status})`);
  }

  // Schritt 3: Transkription starten
  updateProgress(50, "Transkription läuft...");

  const input = {
    audio_url: file_url,
    task: "transcribe",
    chunk_level: "segment",
    version: "3",
  };

  if (language !== "auto") {
    input.language = language;
  }

  let response;
  try {
    response = await fetch("/api/fal-transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        model: falModel,
        input,
      }),
    });
  } catch (fetchErr) {
    throw new Error(`Transkription Netzwerkfehler: ${fetchErr.message}`);
  }

  const responseText = await response.text();

  if (!response.ok) {
    let errorMsg;
    try {
      const errData = JSON.parse(responseText);
      errorMsg = errData.detail?.[0]?.msg || errData.detail || responseText;
    } catch {
      errorMsg = responseText;
    }
    throw new Error(`fal.ai Fehler (${response.status}): ${errorMsg}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("Ungültige Antwort von fal.ai");
  }

  // Timestamps formatieren
  if (timestampsCheckbox.checked && data.chunks && data.chunks.length > 0) {
    const text = data.chunks
      .map((chunk) => {
        const start = chunk.timestamp?.[0] ?? 0;
        return `[${formatTimestamp(start)}] ${chunk.text.trim()}`;
      })
      .join("\n");
    showResult(text);
  } else {
    showResult(data.text || "");
  }
}

// ==========================================
// GROQ TRANSCRIPTION
// ==========================================

async function transcribeWithGroq(apiKey) {
  const MAX_CHUNK_SIZE = 24 * 1024 * 1024;

  if (selectedFile.size <= MAX_CHUNK_SIZE) {
    updateProgress(10, "Transkription läuft...");
    const result = await groqTranscribeChunk(apiKey, selectedFile, 0, 1);
    showResult(result);
  } else {
    updateProgress(0, "Große Datei — wird in Teile aufgeteilt...");
    const chunks = splitFile(selectedFile, MAX_CHUNK_SIZE);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      updateProgress(
        (i / chunks.length) * 100,
        `Teil ${i + 1} von ${chunks.length} wird transkribiert...`
      );
      const result = await groqTranscribeChunk(apiKey, chunks[i], i, chunks.length);
      results.push(result);
    }

    showResult(results.join("\n\n"));
  }
}

function splitFile(file, maxSize) {
  const chunks = [];
  let offset = 0;
  const ext = file.name.split(".").pop().toLowerCase();

  while (offset < file.size) {
    const end = Math.min(offset + maxSize, file.size);
    const blob = file.slice(offset, end);
    chunks.push(new File([blob], `chunk_${chunks.length}.${ext}`, { type: file.type }));
    offset = end;
  }

  return chunks;
}

async function groqTranscribeChunk(apiKey, file, index, total) {
  const language = languageSelect.value;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", modelSelect.value);
  if (language !== "auto") {
    formData.append("language", language);
  }
  formData.append("response_format", "verbose_json");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    let errorMsg;
    try {
      const errData = JSON.parse(responseText);
      errorMsg = errData.error?.message || responseText;
    } catch {
      errorMsg = responseText;
    }
    throw new Error(`Groq API Fehler (${response.status}): ${errorMsg}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("Ungültige Antwort von Groq API");
  }

  updateProgress(
    ((index + 1) / total) * 100,
    index + 1 === total ? "Fertig!" : `Teil ${index + 1} von ${total} fertig`
  );

  if (timestampsCheckbox.checked && data.segments && data.segments.length > 0) {
    return data.segments
      .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text.trim()}`)
      .join("\n");
  }

  return data.text || "";
}

// ==========================================
// RESULT & HELPERS
// ==========================================

function showResult(text) {
  transcript.value = text;
  resultSection.classList.remove("hidden");
  updateProgress(100, "Transkription abgeschlossen!");
  progressText.style.color = "#22c55e";
}

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(transcript.value);
  copyBtn.textContent = "Kopiert!";
  setTimeout(() => (copyBtn.textContent = "Kopieren"), 2000);
});

downloadBtn.addEventListener("click", () => {
  const baseName = selectedFile
    ? selectedFile.name.replace(/\.[^.]+$/, "")
    : "transkript";
  const blob = new Blob([transcript.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}_transkript.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

function updateStartButton() {
  const provider = providerSelect.value;
  const hasKey = provider === "groq"
    ? !!(groqKeyInput.value.trim() || localStorage.getItem("groq_api_key"))
    : !!(falKeyInput.value.trim() || localStorage.getItem("fal_api_key"));
  startBtn.disabled = !selectedFile || !hasKey;
}

function updateProgress(percent, text) {
  progressBar.style.width = `${percent}%`;
  progressText.textContent = text;
  progressText.style.color = "";
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
