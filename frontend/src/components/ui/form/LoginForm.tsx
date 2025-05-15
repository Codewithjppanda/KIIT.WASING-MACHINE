"use client";

import React, { useState } from "react";
import { IconBrandGoogle } from "@tabler/icons-react";
import { signIn, useSession } from "next-auth/react";
import { AnimatedButton } from "@/components/ui/animated-button";

export function LoginForm() {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Starting Google authentication...");
      await signIn("google", {
        redirect: true,
        callbackUrl: "/auth-redirect"
      });
    } catch (error) {
      setError("An error occurred during sign in. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-zinc-900 p-8">
      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome to KIIT Washing Machine
      </h2>
      <p className="text-gray-400 mb-8">
        Sign in with your KIIT email to use washing machines
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <AnimatedButton
        onClick={handleGoogleSignIn}
        disabled={isLoading || status === "loading"}
        variant="primary"
        className="group relative flex h-12 w-full items-center justify-center space-x-2 rounded-full bg-white/10 px-4 hover:bg-white/20 transition-all disabled:opacity-50"
      >
        <IconBrandGoogle className="h-5 w-5" />
        <span>
          {isLoading || status === "loading" ? "Signing in..." : "Sign in with KIIT Email"}
        </span>
      </AnimatedButton>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          You&apos;ll be asked to complete registration if this is your first login
        </p>
      </div>
    </div>
  );
}
