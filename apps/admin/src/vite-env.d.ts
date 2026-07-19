/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVICE_CATALOG_URL?: string
  readonly VITE_SERVICE_REQUEST_ORCHESTRATOR_URL?: string
  readonly VITE_PROVIDER_REGISTRY_URL?: string
  readonly VITE_CONSUMERS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
