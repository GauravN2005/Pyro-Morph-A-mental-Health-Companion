# Pyro-Morph Frontend

Pyro-Morph is now a frontend-only React (Vite) application.

## Current Structure

```text
pyro-morph-fullstack/
├── frontend/
└── README.md
```

## Stack

- React 18
- Vite 5
- Tailwind CSS
- Framer Motion

## Data Persistence

All user data is stored in browser local storage.

- Accounts
- Session token
- Avatar preferences
- Onboarding state
- Mood history
- Message count

No backend service or database is required.

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

App runs at:

- http://localhost:5173

## Build

```bash
cd frontend
npm run build
npm run preview
```

## OpenCV Video Call

The video call page now uses the OpenCV emotion service from [video_call](video_call). Run it in a second terminal when you want live webcam emotion detection.

```bash
cd video_call
\.venv\Scripts\python.exe opencv_api.py
```

The service listens on `http://127.0.0.1:5001`, and the frontend uses that URL by default. If you need to change it, set `VITE_VIDEO_API_URL` in [frontend/.env](frontend/.env).

## Deployment

Deploy the frontend folder to any static hosting provider.

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

No server environment variables are required for core app usage.
