---
trigger: always_on
---

# STRUCTURE.md - Zenner Client Workspace Structure

This document specifies the directory structure of the `zenner-client` repository, clearly dividing the shared modules and specific applications (Web/Desktop vs. Mobile).

---

## 📂 1. Directory Layout

The Zenner Client project is organized under a Monorepo model (or a clear modular structure) to maximize the reusability of state management logic (Zustand, React Query) between Web/Tauri (Desktop) and React Native (Mobile).

```
zenner-client/
├── .agents/                 # Frontend internal AI Agent rules & skills
├── docs/                    # Client internal technical specifications
├── desktop/                 # Tauri Desktop App packaging configuration
├── src-tauri/               # Rust backend of the Tauri Desktop app
├── mobile/                  # React Native (Expo) project
│   ├── components/          # Native UI Components
│   ├── screens/             # Mobile Screens
│   └── App.tsx              # Mobile Entrypoint
├── src/                     # WebApp project (Vite) & shared logic
│   ├── assets/              # Images, fonts (Outfit, Inter)
│   ├── components/          # Shared UI Components (Shadcn/ui)
│   │   ├── ui/              # Original components from Shadcn/ui (Button, Dialog...)
│   │   └── common/          # Custom components for the project
│   ├── config/              # System configuration (axios, routes)
│   ├── hooks/               # Shared custom hooks
│   ├── i18n/                # Multilingual translation files (en/vi)
│   ├── layouts/             # Layout frames (Default, Focus)
│   ├── pages/               # Main Web pages (Daily, Weekly, Monthly)
│   ├── services/            # API call layer connecting to Spring Boot
│   ├── store/               # Zustand state management layer (DailyStore, AuthStore)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper utilities
│   ├── App.tsx              # WebApp Entrypoint
│   └── main.tsx             # Initialize React & Mount DOM
├── index.html               # Vite root HTML file
├── package.json             # Dependencies list & build scripts
├── tailwind.config.js       # CSS tokens customization (PRIMARY: Sky Blue)
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 🔄 2. Logic & UI Separation Strategy (Separation of Concerns)

To facilitate maintenance and optimize performance, we adhere to the following rules:

1.  **State & API independent of UI**:
    *   All API calls via `Axios` + `React Query` and business logic for `Zustand` are centralized in `src/services/` and `src/store/`.
    *   UI source code (Web Page or Mobile Screen) is only responsible for retrieving data from the Store/Hook to display and capturing user interactions.
2.  **API Mocking**:
    *   During development, if the Spring Boot Backend has not yet completed an endpoint, the Frontend will use the built-in mock service in the Axios interceptors configuration to simulate the response data based on the API Specification.
