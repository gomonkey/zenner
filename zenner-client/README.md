# Zenner Client

**Client application for Zenner — The Daily Planner built with React, Tauri, and React Native.**

Zenner Client contains the frontend applications for Web, Desktop (Tauri), and Mobile (React Native), connecting to a Spring Boot backend. It is designed around the core philosophy of **intentional planning, minimalist UI, and zero-distraction focus.**

---

## 🎨 Design & Philosophy

The user interface follows a clean, minimalist bento-grid layout with a calming **Zen Blue** theme.

For detailed specifications, see:

- [PRODUCT.md](file:///d:/MyWorkspace/Hadesthien/zenner/zenner-client/PRODUCT.md) — Product requirements, UX flows, typography (Outfit & Inter), and color palettes.
- [TECH.md](file:///d:/MyWorkspace/Hadesthien/zenner/zenner-client/TECH.md) — Frontend technologies (Vite, Zustand, React Query, Shadcn/ui) and React Doctor performance checklists.
- [STRUCTURE.md](file:///d:/MyWorkspace/Hadesthien/zenner/zenner-client/STRUCTURE.md) — Complete folder directory and architectural patterns.

---

## 🛠️ Core Tech Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tauri** (Desktop packaging wrapper)
- **React Native** / **Expo** (Mobile app)
- **Tailwind CSS** + **Shadcn/ui** + **Framer Motion**
- **Zustand** (Global Client State) & **React Query** (Server Caching)
- **Axios** & **Zod** (API integration & validation)
- **React i18next** (Multilingual: EN/VI)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Rust (for building Tauri desktop apps)
- Expo CLI (for mobile app debugging)

### Installation

1. Clone the repository and navigate to the client folder:
   ```bash
   cd zenner-client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

- **Run Web App (Development mode):**
  ```bash
  npm run dev
  ```
- **Run Desktop App (Tauri dev mode):**
  ```bash
  npm run tauri dev
  ```
- **Run Mobile App (Expo dev mode):**
  ```bash
  npm run expo start
  ```

---

## 📐 Development Guidelines

1.  **Strict Performance (React Doctor)**: Prevent unnecessary re-renders in heavy list views (Daily View blocks). Always clean up subscriptions/listeners in hooks.
2.  **Type Safety (Zod & TypeScript)**: Ensure all API payloads are validated with Zod schemas in the service layer before reaching components.
3.  **Clean Components**: Keep UI components small and decoupled. Re-use Tailwind utility styles via `cn` helper merging.
