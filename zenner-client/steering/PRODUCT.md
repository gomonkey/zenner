---
trigger: always_on
---

🤖 ZENNER: AI AGENT EXECUTION RULES (.cursorrules)

You are an expert full-stack developer specializing in Monorepo architectures. You MUST strictly adhere to the project architecture, coding standards, and execution constraints defined in this document. Never compromise on these rules.

🧭 SYSTEM CONTEXT & IDENTITY

Project Name: INTENT-DAY (Cross-platform Multilingual App)

Tech Stack: Vite 8 + React 19 (Web), Tauri + Rust (Desktop), Expo / React Native (Mobile), pnpm (Monorepo manager), Zustand (State), Zod (Validation), Tailwind CSS (Styling), react-i18next (Localization).

Architecture Philosophy: Strict Separation of Concerns via Workspace Packages.

📂 1️⃣ WORKSPACE BOUNDARIES & DIRECTORY RULES (Monorepo)

The project is structured as a Monorepo managed by pnpm. You MUST strictly respect the boundaries between packages:

apps/web/ (Front-end Web & Desktop):

ONLY contains UI and layout logic for browser/desktop.

ROUTING CONSTRAINT: MUST use Hash Routing (HashRouter) in apps/web/src/routes/AppRoutes.tsx to maintain full compatibility with Tauri. NEVER use browser history API that causes 404 errors on desktop reload.

apps/desktop/:

Desktop application shell powered by Tauri (Rust backend).

apps/mobile/:

Native mobile application powered by Expo / React Native.

packages/core/ (The Project Brain 🧠):

Contains ONLY pure business logic, API clients, Zustand stores, Zod schemas, customs hooks, and helper utilities.

CRITICAL BOUNDARY: NEVER import any UI component, HTML element, style tokens, or UI packages from apps/_ or packages/ui/_ inside core. It must remain pure logic.

packages/ui/ (Design System 🎨):

Split clearly into web (HTML/Radix) and native (React Native components).

CRITICAL BOUNDARY: UI components MUST be presentation-only (stateless/controlled). They MUST NOT make direct API calls, initialize global stores, or manage side-effects. Always pass data and callbacks via props.

Path Aliases Configuration

Always use the correct workspace aliases for cross-package imports:

@intent-day/core/\* ➔ Core business logic

@intent-day/ui/\* ➔ Reusable UI components

@/\* ➔ Local module references within the specific app directory

📦 2️⃣ MODULE SYSTEM & EXPORT CONVENTIONS

ESModules Only: ALWAYS use import and export. NEVER use CommonJS (require, module.exports).

Strict Named Exports: ALWAYS use named exports directly at the declaration line.

Example (Right): export function formatCurrency(value: number): string { ... }

PROHIBITIONS:

NEVER use export default.

NEVER group exports at the bottom of the file (e.g., export { A, B }; is banned).

Index Files Re-exports: All index.ts, index.web.ts, and index.native.ts files must serve solely as direct re-exporters.

Example: export { Button } from "./src/web/components/ui/button";

🛑 3️⃣ TYPESCRIPT STRICTNESS & DATA VALIDATION

Zero Tolerance for any: You are forbidden from writing the any keyword. If a library type definition is missing or dynamic, use unknown combined with type-guards.

Runtime Validation: When handling external sources (API responses, system events, local storage), you MUST use Zod to validate types at runtime.

Zod Schema Inferences: Derive TypeScript types directly from Zod schemas using z.infer<typeof schema>.

import { z } from "zod";

export const userSchema = z.object({
id: z.string(),
name: z.string(),
});

export type User = z.infer<typeof userSchema>;

export function handleUserResponse(data: unknown): User {
return userSchema.parse(data); // Throws explicit error if validation fails
}

🗂️ 4️⃣ NAMING CONVENTIONS MATRIX

You MUST name files, components, and variables strictly according to this matrix:

Artifact Type

Case / Pattern

Suffix / Prefix

Example

Location

UI Components

PascalCase

None

Button.tsx, AuthLayout.tsx

packages/ui/, apps/\*/components/

Web Pages

PascalCase

None

Login.tsx, Profile.tsx

apps/web/src/pages/

Mobile Screens

PascalCase

Screen suffix

LoginScreen.tsx

apps/mobile/src/screens/

Custom Hooks

camelCase

use prefix

useAuth.ts, useDebounce.ts

packages/core/src/hooks/

Zustand Stores

camelCase

use prefix + Store suffix

useAuthStore.ts

packages/core/src/store/

API Clients

camelCase

.api.ts suffix

auth.api.ts

packages/core/src/api/

Zod Schemas

camelCase

.schema.ts suffix

auth.schema.ts

packages/core/src/schemas/

Utilities

camelCase

None

currency.ts, date.ts

packages/core/src/utils/

🔧 5️⃣ COMPONENT ARCHITECTURE & STYLING RULES

Declaration style: Use standard function declarations for major functional components. Use arrow functions const foo = () => {} strictly for internal callbacks or lightweight helper hooks.

Tailwind CSS Utility: Classes inside the className attribute must be merged using the cn() utility function.

Tailwind Class Order: Class names inside cn() MUST follow this sequence order:

Layout & Position (position, display, flex, grid, z-index...)

Box Model (width, height, padding, margin, gap...)

Typography (font-family, text-size, text-color, alignment...)

Visuals (background, border, rounded, shadow, opacity...)

Interaction & State (hover:, focus:, active:, transition, animation...)

import { cn } from '@intent-day/core/utils/cn';

export interface CardProps {
className?: string;
children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
return (
<div
className={cn(
"flex flex-col w-full p-4 bg-card text-card-foreground rounded-lg shadow-sm", // Organized layout -> interaction
className
)} >
{children}
</div>
);
}

🌐 6️⃣ GLOBAL i18n & LOCALIZATION CONVENTIONS

STRICT PROHIBITION: NEVER hardcode any user-facing text, alerts, placeholders, notifications, or headings directly in components, screens, hooks, or stores.

Global Extraction Requirement: Every single piece of UI copy MUST be resolved through the react-i18next framework via the t('key') function.

Localization Source of Truth: Centralize translations inside packages/core/src/locales/ (e.g., vi/common.json and en/common.json). Ensure translation keys remain perfectly synchronized.

Hooks & Stores Copy: If an asynchronous action in a custom hook or store throws an error or requires a notification (e.g., toast.error), pass the translation key or resolve the t() function directly.

// ❌ INCORRECT (Hardcoded text)
export function WelcomeWidget() {
return <h1>Chào mừng bạn đã quay trở lại!</h1>;
}

// ✅ CORRECT (Uses translation hook)
import { useTranslation } from 'react-i18next';

export function WelcomeWidget() {
const { t } = useTranslation();
return <h1>{t('auth.welcome')}</h1>;
}

🧠 7️⃣ PRE-EXECUTION INSPECTION WORKFLOW (FOR AI AGENTS)

Before writing any new block of code, editing existing structures, or responding to user implementations, you MUST perform these automated checks:

Anti-Duplication Scanning: Search existing paths inside packages/core/src/hooks/ and packages/core/src/store/ to ensure the hook/state logic does not already exist. Do not duplicate.

Standard Utility Enforcement: NEVER write plain utility functions for currency, time/date formatting, or storage. You MUST import and call existing core implementations from @intent-day/core/utils/currency and @intent-day/core/utils/date.

Double Check Constraints: Verify that your proposed solution does not break workspace boundaries (e.g., ensuring you aren't pulling UI-related packages into the pure @intent-day/core module).
