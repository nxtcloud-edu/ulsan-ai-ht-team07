/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_API_KEY: string;
  readonly VITE_AI_API_URL: string;
  readonly VITE_MAP_API_KEY: string;
  readonly VITE_MAP_API_TYPE: string;
  readonly VITE_APP_CITY: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
