# Transkription App

Audio & Video zu Text — blitzschnell, in Sekunden.

**[Live Demo](https://transkription-app.netlify.app)**

## Features

- Drag & Drop Upload (MP3, MP4, M4A, WAV, OGG, WEBM)
- **fal.ai Wizper** — 2h Audio in ~10 Sekunden, ~1 Cent/Stunde
- **Groq Whisper** — kostenlos, 2h Audio/Stunde Limit
- Optionale Timestamps (`[1:32] Text...`)
- Sprachauswahl (Deutsch, Englisch, uvm.)
- Download als .txt
- API-Key wird sicher im Browser gespeichert (localStorage)
- Responsive Design, funktioniert auf jedem Gerät
- DSGVO-Hinweis integriert

## Architektur

```
index.html / css / js          → Frontend (statisch, Netlify)
netlify/functions/fal-upload   → Proxy: fal.ai Storage Upload Init
netlify/functions/fal-transcribe → Proxy: fal.ai Transkription
```

**fal.ai Flow:**
1. Browser → Netlify Function → fal.ai Storage Init (bekommt Upload-URL)
2. Browser → fal.ai CDN direkt (Datei hochladen)
3. Browser → Netlify Function → fal.ai Wizper (Transkription)

**Groq Flow:**
- Browser → Groq API direkt (CORS unterstützt)

## Eigene App erstellen

Siehe [ANLEITUNG.md](ANLEITUNG.md) für eine Schritt-für-Schritt-Anleitung:

- **Weg A:** Fork & Deploy (5 Minuten)
- **Weg B:** Selbst bauen mit Claude (60 Minuten)

## Tech Stack

- Vanilla HTML/CSS/JavaScript (kein Framework)
- [Netlify](https://netlify.com) (Hosting + Serverless Functions)
- [fal.ai](https://fal.ai) Wizper (Transkription)
- [Groq](https://groq.com) Whisper Large v3 (Alternative)
- Montserrat Font, Berry/Gold Farbschema

## Lokale Entwicklung

```bash
npm install -g netlify-cli
netlify dev
```

---

*© 2026 [Manuela Ruppert](https://www.manuela-ruppert.de) · [KI Maestra](https://maestra.de)*
*Co-Created with Claude Code by Anthropic*
