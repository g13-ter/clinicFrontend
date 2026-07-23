/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the backend API, including the "/api" prefix.
   * e.g. "https://clinic-backend.up.railway.app/api"
   *
   * Optional in development (Vite's dev-server proxy handles "/api" locally).
   * Required in production when the frontend and backend are deployed as
   * separate services on different domains.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}