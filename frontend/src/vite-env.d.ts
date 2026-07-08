/// <reference types="vite/client" />

// Strongly-typed environment variables (no `any` when reading import.meta.env).
interface ImportMetaEnv {
  /** Base URL of our backend API (which proxies football-data.org). */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
