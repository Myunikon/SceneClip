// vitest.config.ts
import { defineConfig } from "file:///D:/YtDLP%20UI/ClipSceneYT/v3_tauri/node_modules/vitest/dist/config.js";
import react from "file:///D:/YtDLP%20UI/ClipSceneYT/v3_tauri/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\YtDLP UI\\ClipSceneYT\\v3_tauri";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vitest_config_default as default
};
