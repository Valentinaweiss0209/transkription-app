// --- State ---
let selectedFile = null;
let apiKey = localStorage.getItem("groq_api_key") || "";

// --- DOM ---
const apiKeyInput = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const keyStatus = document.getElementById("key-status");
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

// --- Init ---
if (apiKey) {
  apiKeyInput.value = apiKey;
  keyStatus.textContent = "Key gespeichert";
  keyStatus.className = "status-text success";
}
updateStartButton();

// --- API Key ---
saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith("gsk_")) {
    keyStatus.textContent = "Ungültiger Key — muss mit gsk_ beginnen";
    keyStatus.className = "status-text error";
    return;
  }
  apiKey = key;
  localStorage.setItem("groq_api_key", key);
  keyStatus.textContent = "Key gespeichert";
  keyStatus.className = "status-text success";
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
  const validTypes = [
    "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm",
    "video/mp4", "video/webm", "video/quicktime",
  ];
  const ext = file.name.split(".").pop().toLowerCase();
  const validExts = ["mp3", "mp4", "m4a", "wav", "ogg", "webm", "mov"];

  if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
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
  if (!selectedFile || !apiKey) return;

  startBtn.disabled = true;
  progressSection.classList.remove("hidden");
  resultSection.classList.add("hidden");

  try {
    const MAX_CHUNK_SIZE = 24 * 1024 * 1024; // 24 MB (Groq limit: 25 MB)

    if (selectedFile.size <= MAX_CHUNK_SIZE) {
      updateProgress(10, "Transkription läuft...");
      const result = await transcribeChunk(selectedFile, 0, 1);
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
        const result = await transcribeChunk(chunks[i], i, chunks.length);
        results.push(result);
      }

      showResult(results.join("\n\n"));
    }
  } catch (err) {
    updateProgress(0, `Fehler: ${err.message}`);
    progressText.style.color = "#ef4444";
  } finally {
    startBtn.disabled = false;
  }
}

function splitFile(file, maxSize) {
  const chunks = [];
  let offset = 0;
  const ext = file.name.split(".").pop().toLowerCase();

  while (offset < file.size) {
    const end = Math.min(offset + maxSize, file.size);
    const blob = file.slice(offset, end);
    const chunkFile = new File([blob], `chunk_${chunks.length}.${ext}`, {
      type: file.type,
    });
    chunks.push(chunkFile);
    offset = end;
  }

  return chunks;
}

async function transcribeChunk(file, index, total) {
  const language = languageSelect.value;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", modelSelect.value);
  if (language !== "auto") {
    formData.append("language", language);
  }
  formData.append("response_format", "verbose_json");

  // Direkt an Groq API senden (CORS wird unterstützt)
  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
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

  // Timestamps formatieren wenn gewünscht
  if (timestampsCheckbox.checked && data.segments && data.segments.length > 0) {
    return data.segments
      .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text.trim()}`)
      .join("\n");
  }

  return data.text || "";
}

// --- Result ---
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

// --- Helpers ---
function updateStartButton() {
  startBtn.disabled = !selectedFile || !apiKey;
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
