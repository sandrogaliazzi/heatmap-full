/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";

// Plugins
import { registerPlugins } from "@/plugins";
import roleDirective from "./directives/roleDirective";

const app = createApp(App);

registerPlugins(app);

app.directive("role", roleDirective);
app.mount("#app");
