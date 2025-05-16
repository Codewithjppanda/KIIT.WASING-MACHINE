"use client";

import { useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function ResetPasswordContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      setError("You must be logged in with Google to reset your password");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setMessage("");
    
    try {
      // Request password reset using the verified email
      const response = await fetch(`${API_BASE_URL}/api/users/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Password reset instructions have been sent to your email");
      } else {
        setError(data.message || "Failed to request password reset");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Reset Your Password</h2>
        
        {session?.user?.email ? (
          <>
            <p className="text-gray-400 mb-6">
              We&apos;ll send password reset instructions to your email: <span className="text-white">{session.user.email}</span>
            </p>
            
            {message && (
              <div className="mb-6 p-3 bg-green-500/20 text-green-400 text-sm rounded-lg">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </button>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/verify-password')}
                className="text-blue-400 hover:underline text-sm"
              >
                Return to login
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 mb-6">
              Please sign in with your KIIT email first to reset your password
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Sign in with KIIT Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <SessionProvider>
      <ResetPasswordContent />
    </SessionProvider>
  );
} 