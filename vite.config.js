import { defineConfig } from 'vite';

// Relative base so the build works from any path, including https://<user>.github.io/<repo>/.
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 800 } });
