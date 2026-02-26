import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || "https://kaabil.net").trim();

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    preview: {
      allowedHosts: ["kaabil.net", "bioinfo.usu.edu"]
    },
    server: {
      proxy: {
        "/hpinetbackend": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true
        }
      }
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
      globals: true,
      css: true
    }
  };
});
