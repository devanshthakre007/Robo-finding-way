import { defineConfig } from "vite";
import { createModelApiMiddleware } from "./server/modelApi.js";

export default defineConfig({
  plugins: [
    {
      name: "model-api",
      configureServer(server) {
        server.middlewares.use(createModelApiMiddleware());
      },
    },
  ],
});
