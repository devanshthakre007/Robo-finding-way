import { defineConfig } from "vite";
import { createModelApiMiddleware, createAIAssetsMiddleware } from "./server/modelApi.js";

export default defineConfig({
  plugins: [
    {
      name: "model-api",
      configureServer(server) {
        server.middlewares.use(createAIAssetsMiddleware());
        server.middlewares.use(createModelApiMiddleware());
      },
    },
  ],
});
