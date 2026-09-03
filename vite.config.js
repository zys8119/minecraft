import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueDevtools from "vite-plugin-vue-devtools";

const detectEditor = (() => {
  const envstr = JSON.stringify(process.env);
  if (envstr.match(/trae/)) {
    return "./trae.sh";
  } else if (envstr.match(/cursor/)) {
    return "code";
  } else if (envstr.match(/vscode/)) {
    return "code";
  } else {
    return "code";
  }
})();

export default defineConfig({
  plugins: [
    vue(),
    VueDevtools({
      launchEditor: detectEditor,
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
