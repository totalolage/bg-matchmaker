import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  console.error("missing envar VITE_CONVEX_URL");
}

const convex = new ConvexReactClient(CONVEX_URL);

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </ConvexProvider>
);
