"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function VerifyPassword() {
  const { data: session } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/users/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          password: password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", session?.user?.email || "");
        localStorage.setItem("userName", data.name || "");
        localStorage.setItem("userFloor", data.floor || "");
        
        router.push("/dashboard");
      } else {
        setError("Invalid password");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/10 text-white mb-4"
            placeholder="Enter your password"
          />
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
} 