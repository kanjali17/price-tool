/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMPLITUDE_API_KEY?: string
  readonly VITE_AMPLITUDE_SECRET_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
