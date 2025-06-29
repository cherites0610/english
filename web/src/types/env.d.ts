interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}