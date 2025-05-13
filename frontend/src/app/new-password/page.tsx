"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Get token and email from URL
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  
  useEffect(() => {
    if (!token || !email) {
      setError("Invalid password reset link");
    }
  }, [token, email]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        // Redirect after a delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Set New Password</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-3 bg-green-500/20 text-green-400 text-sm rounded-lg">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white mb-2"
              placeholder="New Password"
            />
          </div>
          
          <div className="mb-6">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white"
              placeholder="Confirm New Password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !token || !email}
            className="w-full p-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
} 