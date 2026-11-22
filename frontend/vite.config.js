import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// The dev server uses port 5200. The backend allows this origin in CORS.
export default defineConfig({
  plugins: [react()],
  server: { port: 5200, strictPort: true },
  preview: { port: 5200, strictPort: true },
});
