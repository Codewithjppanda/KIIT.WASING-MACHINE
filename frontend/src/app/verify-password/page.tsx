"use client";

import { useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/ui/button";

function VerifyPasswordContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('VerifyPassword: API_BASE_URL =', API_BASE_URL);
    console.log('VerifyPassword: calling login endpoint at', `${API_BASE_URL}/api/users/login`);
    setIsLoading(true);
    
    try {
      console.log("Sending verification request for email:", session?.user?.email);
      
      // Use the login endpoint instead of verify-password
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          password: password
        }),
      });
      
      // Log the full URL and response status for debugging
      console.log("Response status:", response.status);
      
      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response received:", contentType);
        setError("Server returned an invalid response format. Please try again later.");
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", session?.user?.email || "");
        localStorage.setItem("userName", data.name || "");
        localStorage.setItem("userFloor", data.floor || "");
        
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid password");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("Server error or endpoint not found. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Enter Your Password</h2>
        <p className="text-gray-400 mb-6">
          Please enter your password to complete the login process
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Verifying..." : "Continue"}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/reset-password')}
            className="text-blue-400 hover:underline text-sm"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPassword() {
  return (
    <SessionProvider>
      <VerifyPasswordContent />
    </SessionProvider>
  );
} 