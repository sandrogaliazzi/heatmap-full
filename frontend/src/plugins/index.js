/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import { loadFonts } from "./webfontloader";
import vuetify from "./vuetify";
import { createPinia } from "pinia";
import router from "@/router";
import VueGoogleMaps from "@fawmi/vue-google-maps";
import { VueWindowSizePlugin } from "vue-window-size/plugin";
import VirtualList from "vue-virtual-list-v3";

export function registerPlugins(app) {
  loadFonts();
  const pinia = createPinia(app);
  app.use(pinia);
  app.use(vuetify);
  app.use(router);
  app.use(VueWindowSizePlugin);
  app.use(VirtualList);
  app.use(VueGoogleMaps, {
    load: {
      version: 3.52,
      key: import.meta.env.VITE_GOOGLE_API_KEY,
      libraries: ["visualization", "geometry"],
    },
  });
}
