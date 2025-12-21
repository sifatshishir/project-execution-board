# Single Project Execution Board

A premium, offline-first execution board for managing a single project.
Built with Next.js 14+, Tailwind CSS, and Google Drive for persistence.

## Features

- **Google Drive Persistence**: Your data lives in *your* Google Drive (`project-execution-board.json`).
- **Offline First**: Works without internet using IndexedDB. Syncs when back online.
- **Premium UI**: Framer Motion animations, dark mode, clean typography.
- **Zero Backend**: 100% Client-side architecture.

## Getting Started

### Prerequisites

1.  **Google Cloud Project**:
    - Go to [Google Cloud Console](https://console.cloud.google.com).
    - Create a new project.
    - Enable **Google Drive API**.
    - Configure **OAuth Consent Screen** (External, add yourself as test user).
    - Create **OAuth 2.0 Credentials** (Web Application).
    - Add `http://localhost:3000` to Authorized Origins.
    - Copy the **Client ID**.

2.  **Run the Application**:
    ```bash
    npm run dev
    ```

3.  **Setup Connection**:
    - Open [http://localhost:3000](http://localhost:3000).
    - You will see a **Setup Screen**.
    - Paste your **Client ID** from step 1.
    - Click **Save & Continue**.
    - Login with Google.

    *Note: Your Client ID is stored locally in your browser. You can change it anytime from the login screen.*

## Architecture

- **Domain Driven Design**: `src/features/board/domain` holds pure logic.
- **Adapters**: `src/persistence` handles IDB and Drive.
- **Clean State**: `zustand` store (`projectStore`) manages application state and sync logic.
- **Components**: Feature-based directory structure.

## Deployment

Deploy on Vercel:

1.  Push to GitHub.
2.  Import in Vercel.
3.  Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variable.
4.  Add your production domain to Google Cloud Console Authorized Origins.

## Limitations (MVP)

- Single project only.
- Conflict resolution: Last-write-wins.
- No real-time collaboration (syncs on debounce/load).
