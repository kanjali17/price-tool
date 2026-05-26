/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMPLITUDE_API_KEY?: string
  readonly VITE_AMPLITUDE_QUERY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
