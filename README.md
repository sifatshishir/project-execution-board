# Single Project Execution Board

A premium, offline-first execution board for managing a single project. 
Built with Next.js, Tailwind CSS, and Google Drive for private, user-owned persistence.

## 🚀 Key Features

- **Google Drive Persistence**: Your data lives in *your* private Google Drive App Data folder (`project-execution-board.json`). Total privacy.
- **Persistent Task Reordering**: Arrange tasks as you please with custom drag-and-drop positions that persist across sessions.
- **Team Sync**: Automatically sync project members from your Google Drive file permissions.
- **Advanced Filtering**: Focus on specific team members or search tasks instantly.
- **Interactive Onboarding**: Guided tour powered by `driver.js` to get new users up to speed.
- **Offline First**: Works without internet using IndexedDB. Auto-syncs when back online.
- **Premium UI**: Modern glassmorphism design, smooth `framer-motion` animations, and full Dark/Light mode support.
- **Zero Backend**: 100% Client-side architecture. No server costs, no data mining.

## 🛠️ Getting Started

### 1. Google Cloud Configuration

To enable Drive persistence, you need a Google Client ID:

1.  Go to [Google Cloud Console](https://console.cloud.google.com).
2.  Enable the **Google Drive API**.
3.  Configure **OAuth Consent Screen**:
    - Select **External**.
    - **IMPORTANT**: Add your email to the **Test Users** list.
4.  Create **OAuth 2.0 Client ID** (Web Application):
    - Authorized JavaScript origins: `http://localhost:3000` (and your production URL).
    - Authorized redirect URIs: `http://localhost:3000` (and your production URL).

### 2. Local Setup

```bash
git clone <your-repo-url>
cd project-execution-board
npm install
npm run dev
```

### 3. Connect

- Open [http://localhost:3000](http://localhost:3000).
- Paste your **Client ID** in the setup screen.
- Log in and start building!

## 🏗️ Technical Stack

- **Framework**: Next.js (App Router)
- **State**: Zustand (with Persist middleware)
- **Persistence**: Google Drive API + IndexedDB
- **Drag & Drop**: @dnd-kit (with Sortable strategies)
- **Tours**: driver.js
- **Icons**: Lucide React
- **Styling**: Tailwind CSS + next-themes

## 📄 License

MIT - Feel free to use and modify for your own projects!

