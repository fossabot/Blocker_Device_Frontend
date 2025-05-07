/// <reference types="vite/client" />

interface Window {
  __THREE_DEVTOOLS__?: {
    dispatchEvent: (event: CustomEvent) => void;
  };
}
