import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import { customLogger } from "./src/plugins/vite-logger";

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    customLogger()
  ],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
});