import { Authenticated, Unauthenticated } from "convex/react";
import { RouterProvider } from "@tanstack/react-router";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { createRouter } from "./router";

const router = createRouter();

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Authenticated>
        <RouterProvider router={router} />
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎲 GameMatch
              </h1>
              <p className="text-gray-600">
                Find your perfect board game session
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      
      <Toaster />
    </div>
  );
}
