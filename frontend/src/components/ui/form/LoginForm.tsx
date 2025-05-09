"use client";

import React, { useState, useEffect } from "react";
import { IconBrandGoogle } from "@tabler/icons-react";
import { signIn, useSession } from "next-auth/react";

export function LoginForm() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  // Monitor session status to detect when user completes Google auth
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      console.log("User authenticated with email:", session.user.email);
      // If we get here, Google auth was successful and email was verified
    } else if (status === "loading") {
      console.log("Session loading...");
    } else if (status === "unauthenticated") {
      console.log("User is not authenticated");
    }
  }, [session, status]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Starting Google authentication...");
      // Use signIn with redirect: false to keep user on the same page
      const result = await signIn("google", {
        redirect: false
      });
      
      console.log("Google sign-in result:", result);
      
      if (result?.error) {
        console.error("Google sign-in error:", result.error);
        setError(result.error);
      }
    } catch (error) {
      setError("An error occurred during sign in. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log("Sending login request to backend with email:", session.user.email);
      
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          password: password
        }),
      });

      // If response is not ok, try to get the error message from the response
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login error response:", errorText);
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          setError(errorData.message || "Login failed. Please try again.");
        } catch {
          // If parsing fails, it's probably HTML or other non-JSON response
          setError("Server returned an unexpected response. Please try again later.");
        }
        return;
      }

      const data = await response.json();
      console.log("Login successful:", data);

      // Store authentication data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", session.user.email);
      localStorage.setItem("userName", data.name || session.user.name || "");
      localStorage.setItem("userFloor", data.floor || "");
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-zinc-900 p-8">
      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome back
      </h2>
      <p className="text-gray-400 mb-8">
        Login to use washing machines at KIIT Hostel
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Show password form if Google auth is complete */}
      {status === "authenticated" && session?.user?.email ? (
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <p className="text-white">{session.user.email}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-white/10 text-white border-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Continue"}
          </button>
        </form>
      ) : (
        // Show Google Sign In button if not authenticated
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading || status === "loading"}
          className="group relative flex h-12 w-full items-center justify-center space-x-2 rounded-lg bg-white/10 px-4 hover:bg-white/20 transition-all disabled:opacity-50"
        >
          <IconBrandGoogle className="h-5 w-5 text-white" />
          <span className="text-white font-medium">
            {isLoading || status === "loading" ? "Signing in..." : "Sign in with KIIT Email"}
          </span>
        </button>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
