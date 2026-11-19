---
trigger: always_on
---

# TECH.md - Zenner Client Tech Stack & Architecture

This document details the development tools, supporting libraries, and quality/performance monitoring tools in the Zenner Client project.

---

## 🛠️ 1. Tech Stack Overview

### A. Framework & Build Tools
*   **Vite 8**: Extremely fast build tool for the WebApp, supporting instant Hot Module Replacement (HMR).
*   **Tauri**: Packages the WebApp into a lightweight native Desktop application (using Rust for the backend and the OS WebView for the frontend).
*   **React Native / Expo**: Cross-platform mobile application development (iOS & Android).

### B. State Management & Data Fetching
*   **React Query (TanStack Query)**: Manages cache, synchronizes server state, auto-refetching, and optimizes bandwidth.
*   **Axios**: HTTP client library for calling the Spring Boot API, integrated with interceptors for automatic Token handling.
*   **Zustand**: Extremely lightweight client-side state management library, no Redux-like Boilerplate, optimized for re-renders.

### C. Styling & UI Components
*   **Tailwind CSS**: Quickly build interfaces using Utility classes, easy Theme customization.
*   **Shadcn/ui**: Minimalist UI component suite, built on Radix UI (accessible) and Tailwind, allowing direct source code copy-pasting for deep customization.
*   **React Loading Skeleton**: Smooth and professional display of waiting/loading states (Skeleton loaders).
*   **Lucide React**: Minimalist, modern, and lightweight SVG icon pack.
*   **Framer Motion**: Library for handling micro-interactions, page transitions, and smooth animations for React.
*   **Sonner**: Minimalist, elegant toast notification library, supporting swipe-to-dismiss gestures.

### D. Forms & Validation
*   **TanStack React Form**: Powerful Form handling solution, optimized for re-renders, with full type-safe support.
*   **Zod**: Powerful schema validation to check form inputs and API response data.

### E. Internationalization (i18n)
*   **React i18next**: Multilingual support for the application (default: English and Vietnamese).

---

## 🩺 2. Performance Tooling

### React Doctor (Quality Monitoring Workflow)
We apply **React Doctor** and periodic quality inspection tools to check Frontend performance:

1.  **Useless Render Diagnosis (Anti-Pattern: Double Renders)**:
    *   Use React Profiler to measure the render time of complex components such as Calendar or Timeline.
    *   Use memoization (`useMemo`, `useCallback`, `React.memo`) appropriately for long task lists.
2.  **Memory Leak Prevention**:
    *   Check the cleanup of Event Listeners, WebSocket subscriptions, or `setInterval` timers in the `useEffect` hook.
3.  **Accessibility Audit (A11y)**:
    *   Ensure all Shadcn/ui buttons and inputs have ARIA labels compatible with screen readers (using the `wcag-audit-patterns` skill).
4.  **Bundle Size Optimization**:
    *   Configure Vite Code Splitting (dynamic route splitting) to lazy-load screens such as Monthly View and Reflection View only when needed.
