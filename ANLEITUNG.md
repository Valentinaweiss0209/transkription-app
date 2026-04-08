# Transkription App — Bauanleitung für Maestras

Deine eigene Transkriptions-App: Audio & Video zu Text — blitzschnell, für wenige Cent.

---

## Was du brauchst

1. **fal.ai API-Key** (~1 Cent pro Stunde Audio) → [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
2. **GitHub Account** (kostenlos) → [github.com](https://github.com)
3. **Netlify Account** (kostenlos) → [netlify.com](https://app.netlify.com)
4. Optional: **Groq API-Key** (kostenlos, aber mit Limits) → [console.groq.com](https://console.groq.com)

Zeitaufwand: 5–10 Minuten (Weg A) oder ca. 60 Minuten (Weg B)

---

## Weg A: Fork & Deploy (schnell, 5 Minuten)

Du kopierst die fertige App und veröffentlichst sie unter deiner eigenen URL. Kein Code schreiben nötig.

### Schritt 1: fal.ai API-Key holen

1. Gehe auf [fal.ai](https://fal.ai) und erstelle einen Account
2. Gehe auf [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
3. Klicke **Add Key** → Name vergeben → **Create Key**
4. **WICHTIG: Kopiere den vollständigen Key SOFORT** — er wird nur einmal angezeigt!
5. Der Key besteht aus zwei Teilen mit einem `:` in der Mitte, z.B. `abc123-def:xyz789secret`
6. Speichere ihn sicher (z.B. im Passwort-Manager)

### Schritt 2: Repository forken

1. Gehe auf [github.com/CryptoManuela/transkription-app](https://github.com/CryptoManuela/transkription-app)
2. Klicke oben rechts auf **Fork**
3. Klicke **Create fork**
4. Du hast jetzt eine eigene Kopie des Codes auf deinem GitHub

### Schritt 3: Auf Netlify veröffentlichen

1. Gehe auf [app.netlify.com](https://app.netlify.com)
2. Logge dich ein (oder registriere dich kostenlos)
3. Klicke **Add new project** → **Import an existing project**
4. Wähle **GitHub** und autorisiere den Zugriff
5. Wähle dein Repository **transkription-app**
6. Alles auf Standard lassen → **Deploy**
7. Nach ca. 30 Sekunden bekommst du deine URL (z.B. `dein-name-transkription.netlify.app`)

### Schritt 4: App nutzen

1. Öffne deine neue URL
2. Anbieter: **fal.ai** ist vorausgewählt (empfohlen)
3. Gib deinen fal.ai Key ein → **Speichern** — das Eingabefeld klappt sich ein
4. Ziehe eine Audio- oder Videodatei rein (Drag & Drop oder klicken)
5. Sprache wählen (Standard: Deutsch)
6. Optional: Timestamps aktivieren
7. Klicke **Transkription starten**
8. Fertig — Transkript erscheint, kann kopiert oder als .txt heruntergeladen werden

**Key-Verwaltung:** Nach dem Speichern zeigt die App zwei Buttons: **Key ändern** (zum Bearbeiten) und **Key löschen** (zum Entfernen). Dein Key bleibt in deinem Browser gespeichert und muss nicht jedes Mal neu eingegeben werden.

### Optional: URL anpassen

In Netlify unter **Site configuration** → **Change site name** kannst du die URL ändern, z.B. `mein-name-transkription.netlify.app`.

---

## Weg B: Selbst bauen mit Claude (Lernprojekt, ~60 Min)

Du baust die App Schritt für Schritt mit Claude (Desktop App oder Claude Code). Maximaler Lerneffekt!

**Hinweis:** Dieser Weg ist anspruchsvoller. Claude baut die App nach deinem Prompt, aber das Ergebnis muss eventuell debuggt werden — das gehört zum Lernprozess dazu! Wenn du lieber sofort eine funktionierende App willst, nimm Weg A. Weg B ist für alle, die verstehen wollen wie so eine App von innen funktioniert.

### Vorbereitung

1. **fal.ai API-Key** holen (siehe Weg A, Schritt 1)
2. **GitHub Account** anlegen
3. **Netlify Account** anlegen

### Prompt 1: Projekt erstellen

Kopiere diesen Prompt in Claude:

> Erstelle mir eine Transkriptions-Web-App. Die App soll:
>
> **Frontend (index.html + css/style.css + js/app.js):**
> - Anbieter-Auswahl: fal.ai (Standard) und Groq (kostenlose Alternative)
> - Separates API-Key-Feld je nach Anbieter (Key wird in localStorage gespeichert)
> - Drag & Drop Upload für Audio/Video-Dateien (MP3, MP4, M4A, WAV, OGG, WEBM)
> - Sprachauswahl (Deutsch, Englisch, Französisch, etc.)
> - Modellauswahl (bei fal.ai: Wizper; bei Groq: Whisper Large v3 / Turbo)
> - Checkbox für optionale Timestamps
> - Fortschrittsbalken
> - Ergebnis-Textarea mit Kopieren- und Download-Button (.txt)
> - DSGVO-Hinweis dass Audio an Server in den USA gesendet wird
> - Modernes, elegantes Design
>
> **Backend (Netlify Functions):**
> - `netlify/functions/fal-upload.mjs`: Proxy für fal.ai Storage Upload Init
>   - POST an https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3
>   - Empfängt api_key, file_name, content_type vom Frontend
>   - Gibt upload_url und file_url zurück
>
> - `netlify/functions/fal-transcribe.mjs`: Proxy für fal.ai Transkription
>   - POST an https://fal.run/{model} (z.B. fal-ai/wizper)
>   - Empfängt api_key, model, input vom Frontend
>   - Input enthält: audio_url, task, chunk_level, version, language
>
> **fal.ai Flow (3 Schritte):**
> 1. Frontend ruft /api/fal-upload auf → bekommt upload_url + file_url
> 2. Frontend lädt Datei direkt an upload_url hoch (PUT, kein Auth nötig)
> 3. Frontend ruft /api/fal-transcribe auf mit file_url → bekommt Transkript
>
> **Groq Flow:**
> - Direkt vom Browser an https://api.groq.com/openai/v1/audio/transcriptions
> - FormData mit file, model, language, response_format
> - Große Dateien (>24MB) automatisch in Chunks aufteilen
>
> **Timestamps:**
> - fal.ai: data.chunks[].timestamp[0] für Startzeit
> - Groq: data.segments[].start für Startzeit
> - Format: [M:SS] oder [H:MM:SS]
>
> **Konfiguration:**
> - netlify.toml mit publish = "." und functions = "netlify/functions"
> - .gitignore für node_modules, .env, .netlify
>
> Halte den Code einfach und gut kommentiert.

### Prompt 2: Testen

> Starte einen lokalen Server damit ich die App im Browser testen kann.

Claude wird `npx netlify dev` oder `npx serve .` vorschlagen. Öffne die angezeigte URL im Browser und teste mit einer kurzen Audiodatei.

### Prompt 3: Auf GitHub & Netlify veröffentlichen

> Erstelle ein GitHub-Repo namens "transkription-app" und pushe den Code. Deploye die App dann auf Netlify.

### Prompt 4: Anpassen (optional)

Jetzt kannst du die App nach deinen Wünschen anpassen:

> Ändere die Farben zu [deine Farben]. Ändere den Titel zu [dein Titel].

Oder:

> Füge eine Option hinzu, die das Transkript zusammenfasst.

Jede Änderung deployst du mit:

> Pushe die Änderungen auf GitHub und deploye auf Netlify.

---

## Anbieter im Vergleich

| | fal.ai (empfohlen) | Groq (kostenlos) |
|---|---|---|
| **Kosten** | ~1 Cent pro Stunde Audio | Kostenlos |
| **Geschwindigkeit** | 2h Audio in ~10 Sekunden | ~30 Sekunden pro Minute |
| **Datei-Limit** | Keine praktische Grenze | 25 MB / 2h Audio pro Stunde |
| **Modell** | Wizper (optimiertes Whisper) | Whisper Large v3 |
| **Qualität Deutsch** | Ausgezeichnet | Ausgezeichnet |
| **API-Key** | Besteht aus KEY_ID:KEY_SECRET | Beginnt mit gsk_ |

**Empfehlung:** Starte mit fal.ai — blitzschnell, fast kostenlos, keine Limits.

---

## Tipps & Tricks

### fal.ai API-Key
- Der Key besteht aus **zwei Teilen** getrennt durch einen Doppelpunkt: `KEY_ID:KEY_SECRET`
- Der Secret-Teil wird **nur einmal bei Erstellung** angezeigt — sofort sicher speichern!
- Keys verwalten: [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)

### Groq Rate Limits (falls du Groq nutzt)
- **2 Stunden Audio pro Stunde** — reicht für einen 90-Minuten-Call
- Limit wird stündlich zurückgesetzt
- Tipp: **Zero Data Retention** in den [Groq-Einstellungen](https://console.groq.com/settings/data) aktivieren

### Unterstützte Formate
MP3, MP4, M4A, WAV, OGG, WEBM

### Funktioniert auf jedem Gerät
- Mac, Windows, Linux — egal
- Sogar auf dem Handy (Datei über "Auswählen" statt Drag & Drop)
- Kein Install nötig, läuft komplett im Browser

---

## Häufige Fragen

**Was kostet das?**
fal.ai: ~1 Cent pro Stunde Audio. Ein 90-Minuten-Zoom-Call kostet ca. 1,5 Cent. GitHub und Netlify sind kostenlos. Alternativ: Groq ist komplett kostenlos (mit Limits).

**Sieht jemand meinen API-Key?**
Nein. Der Key ist nur in deinem eigenen Browser gespeichert. Wenn jemand anders deine App-URL öffnet, muss die Person ihren eigenen Key eingeben.

**Was passiert mit meinen Audio-Dateien?**
Die Datei wird zur Transkription an fal.ai bzw. Groq Server (USA) gesendet. Die Datei wird nach der Verarbeitung nicht dauerhaft gespeichert.

**Wie gut ist die Transkription?**
Wizper/Whisper Large v3 ist eines der besten Transkriptionsmodelle weltweit — besonders gut für Deutsch. Nicht perfekt bei starkem Dialekt oder schlechter Audioqualität, aber für Meetings und Gespräche ausgezeichnet.

**Kann ich Timestamps einschalten?**
Ja! Hake die Checkbox "Timestamps anzeigen" an. Dann steht vor jedem Abschnitt die Zeitangabe, z.B. `[1:32] Das nächste Thema ist...`

**Mein fal.ai Key funktioniert nicht?**
Prüfe: Hast du den **vollständigen** Key kopiert (mit dem `:` in der Mitte)? Der Secret-Teil wird nur einmal angezeigt. Im Zweifel: neuen Key erstellen.

---

## Häufige Fehler & Fixes (besonders für Weg B)

Beim Bauen der App mit Claude können folgende Probleme auftreten. Das ist normal — Debugging gehört zum Prozess!

### "No user found for Key ID and Secret"
**Ursache:** Der fal.ai Key ist unvollständig oder falsch formatiert.
**Fix:** Der Key muss BEIDE Teile enthalten, getrennt durch `:` — also `KEY_ID:KEY_SECRET`. Wenn du nur den ersten Teil hast (z.B. `0af4aa58-3b52-...` ohne Doppelpunkt), fehlt der Secret. Erstelle einen neuen Key und kopiere ihn sofort vollständig.

### "Failed to fetch"
**Ursache:** CORS — der Browser blockiert direkte API-Calls an fal.ai.
**Fix:** Die fal.ai Calls (Storage Upload Init + Transkription) müssen über **Netlify Functions** laufen. Nur der Datei-Upload an die CDN-URL geht direkt vom Browser. Sage Claude: *"Die fal.ai API-Calls müssen über Netlify Functions als Proxy laufen, nicht direkt vom Browser."*

### "404: Not Found" bei der Transkription
**Ursache:** Falscher Modell-Name in der URL. fal.ai Modelle heißen `fal-ai/wizper` oder `fal-ai/whisper` — nicht `whisper-large-v3` (das ist Groq).
**Fix:** Prüfe ob das Modell-Dropdown die richtigen Werte hat. Bei fal.ai muss die URL `https://fal.run/fal-ai/wizper` sein, nicht `https://fal.run/whisper-large-v3`. Sage Claude: *"Die Modell-Optionen im Dropdown müssen beim Laden zum gewählten Anbieter passen. fal.ai nutzt fal-ai/wizper, Groq nutzt whisper-large-v3."*

### "Rate limit reached" (nur Groq)
**Ursache:** Du hast das Groq-Stundenlimit erreicht (2h Audio pro Stunde).
**Fix:** Warte bis das Limit zurückgesetzt wird (steht in der Fehlermeldung), oder wechsle zu fal.ai. Tipp: Nicht mehrfach mit der gleichen großen Datei probieren — jeder Versuch verbraucht Kontingent, auch wenn er fehlschlägt.

### "Internal Server Error" / "Unexpected end of JSON"
**Ursache:** Die Netlify Function crasht, oft wegen zu großer Dateien (>6 MB Body-Limit).
**Fix:** Dateien dürfen NICHT durch die Netlify Function geschickt werden. Der Flow muss sein: Netlify Function holt nur die Upload-URL, die Datei selbst wird direkt an die CDN-URL geschickt. Sage Claude: *"Die Audio-Datei darf nicht durch die Netlify Function geschickt werden. Nur die Upload-URL-Anfrage geht über die Function, der eigentliche File-Upload geht direkt vom Browser an die upload_url."*

### Die App zeigt "Fehler:" ohne Fehlermeldung
**Ursache:** Der Fehler hat keine `.message` Property.
**Fix:** Sage Claude: *"Die Fehlerbehandlung im catch-Block muss auch err.detail und JSON.stringify(err) prüfen, nicht nur err.message."*

### Timestamps funktionieren nicht
**Ursache:** fal.ai und Groq geben Timestamps in unterschiedlichen Formaten zurück.
**Fix:** Bei fal.ai heißen sie `data.chunks[].timestamp[0]`, bei Groq `data.segments[].start`. Sage Claude: *"Timestamps müssen je nach Anbieter unterschiedlich ausgelesen werden."*

### Modell-Dropdown zeigt falsche Optionen
**Ursache:** Beim Laden der Seite wird das Dropdown nicht zum gewählten Anbieter aktualisiert.
**Fix:** Sage Claude: *"Die Funktion updateModelOptions() muss beim Laden der Seite aufgerufen werden, nicht nur beim Wechsel des Anbieters."*

---

## Datenschutzhinweis

Die Audio-Datei wird zur Transkription an **fal.ai** bzw. **Groq** (Server in den USA) gesendet. Bei Aufnahmen mit anderen Personen bitte deren Einverständnis einholen.

---

*Gebaut mit Wizper/Whisper via fal.ai & Groq · © 2026 Manuela Ruppert · KI Maestra*
*Co-Created with Claude Code by Anthropic*
