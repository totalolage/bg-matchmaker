import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tanstackRouter from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Check if --host flag is present
  const isHostMode = process.argv.includes("--host");

  return {
    plugins: [
      tanstackRouter(),
      react(),
      VitePWA({
        registerType: "prompt",
        injectRegister: "auto",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon.svg"],
        srcDir: "src",
        filename: "sw.ts",
        strategies: "injectManifest",
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.boardgamegeek\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "bgg-api-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "convex-api-cache",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
        manifest: {
          name: "DeskoSpojka - Board Game Matchmaker",
          short_name: "DeskoSpojka",
          description:
            "Find board game players and organize game sessions in your area",
          theme_color: "#7c3aed",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          orientation: "portrait",
          categories: ["games", "social", "entertainment"],
          icons: [
            {
              src: "/pwa-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-256x256.png",
              sizes: "256x256",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
      // The code below enables dev tools like taking screenshots of your site
      // while it is being developed on chef.convex.dev.
      // Feel free to remove this code if you're no longer developing your app with Chef.
      mode === "development" ?
        {
          name: "inject-chef-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
      // End of code for taking screenshots on chef.convex.dev.
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@convex": path.resolve(__dirname, "./convex"),
      },
    },
    server: {
      https:
        isHostMode ?
          {
            key: fs.readFileSync("./certs/key.pem"),
            cert: fs.readFileSync("./certs/cert.pem"),
          }
        : undefined,
      host: isHostMode, // Only expose to network when --host is used
    },
  };
});
