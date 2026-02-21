// vite.config.js
import vue from "file:///C:/Users/Sandro/Documents/HEATMAP/heatmap-full/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vuetify, { transformAssetUrls } from "file:///C:/Users/Sandro/Documents/HEATMAP/heatmap-full/frontend/node_modules/vite-plugin-vuetify/dist/index.js";
import { defineConfig } from "file:///C:/Users/Sandro/Documents/HEATMAP/heatmap-full/frontend/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
import basicSsl from "file:///C:/Users/Sandro/Documents/HEATMAP/heatmap-full/frontend/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Sandro/Documents/HEATMAP/heatmap-full/frontend/vite.config.js";
var vite_config_default = defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true
    })
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"]
  },
  optimizeDeps: {
    include: ["@fawmi/vue-google-maps", "fast-deep-equal"]
  },
  server: {
    port: 5e3,
    allowedHosts: ["heatmap.conectnet.net"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYW5kcm9cXFxcRG9jdW1lbnRzXFxcXEhFQVRNQVBcXFxcaGVhdG1hcC1mdWxsXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTYW5kcm9cXFxcRG9jdW1lbnRzXFxcXEhFQVRNQVBcXFxcaGVhdG1hcC1mdWxsXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TYW5kcm8vRG9jdW1lbnRzL0hFQVRNQVAvaGVhdG1hcC1mdWxsL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Ly8gUGx1Z2luc1xyXG5pbXBvcnQgdnVlIGZyb20gXCJAdml0ZWpzL3BsdWdpbi12dWVcIjtcclxuaW1wb3J0IHZ1ZXRpZnksIHsgdHJhbnNmb3JtQXNzZXRVcmxzIH0gZnJvbSBcInZpdGUtcGx1Z2luLXZ1ZXRpZnlcIjtcclxuXHJcbi8vIFV0aWxpdGllc1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tIFwibm9kZTp1cmxcIjtcclxuXHJcbmltcG9ydCBiYXNpY1NzbCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tYmFzaWMtc3NsXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHZ1ZSh7XHJcbiAgICAgIHRlbXBsYXRlOiB7IHRyYW5zZm9ybUFzc2V0VXJscyB9LFxyXG4gICAgfSksXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdnVldGlmeWpzL3Z1ZXRpZnktbG9hZGVyL3RyZWUvbmV4dC9wYWNrYWdlcy92aXRlLXBsdWdpblxyXG4gICAgdnVldGlmeSh7XHJcbiAgICAgIGF1dG9JbXBvcnQ6IHRydWUsXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIGRlZmluZTogeyBcInByb2Nlc3MuZW52XCI6IHt9IH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IGZpbGVVUkxUb1BhdGgobmV3IFVSTChcIi4vc3JjXCIsIGltcG9ydC5tZXRhLnVybCkpLFxyXG4gICAgfSxcclxuICAgIGV4dGVuc2lvbnM6IFtcIi5qc1wiLCBcIi5qc29uXCIsIFwiLmpzeFwiLCBcIi5tanNcIiwgXCIudHNcIiwgXCIudHN4XCIsIFwiLnZ1ZVwiXSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1wiQGZhd21pL3Z1ZS1nb29nbGUtbWFwc1wiLCBcImZhc3QtZGVlcC1lcXVhbFwiXSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogNTAwMCxcclxuICAgIGFsbG93ZWRIb3N0czogW1wiaGVhdG1hcC5jb25lY3RuZXQubmV0XCJdLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sV0FBVywwQkFBMEI7QUFHNUMsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxlQUFlLFdBQVc7QUFFbkMsT0FBTyxjQUFjO0FBUjhNLElBQU0sMkNBQTJDO0FBV3BSLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxNQUNGLFVBQVUsRUFBRSxtQkFBbUI7QUFBQSxJQUNqQyxDQUFDO0FBQUE7QUFBQSxJQUVELFFBQVE7QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRLEVBQUUsZUFBZSxDQUFDLEVBQUU7QUFBQSxFQUM1QixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsSUFDQSxZQUFZLENBQUMsT0FBTyxTQUFTLFFBQVEsUUFBUSxPQUFPLFFBQVEsTUFBTTtBQUFBLEVBQ3BFO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsMEJBQTBCLGlCQUFpQjtBQUFBLEVBQ3ZEO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjLENBQUMsdUJBQXVCO0FBQUEsRUFDeEM7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
