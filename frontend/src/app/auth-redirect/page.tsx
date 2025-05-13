"use client";

import { useEffect, useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

function AuthRedirectContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserExists() {
      if (!session?.user?.email) return;
      
      try {
        // Check if user exists in the database
        const response = await fetch(
          `http://localhost:5000/api/users/check-email?email=${session.user.email}`
        );
        
        if (!response.ok) {
          throw new Error("Server error when checking user status");
        }
        
        const data = await response.json();
        
        if (data.exists) {
          // User exists, redirect to password verification
          router.push("/verify-password");
        } else {
          // User doesn't exist, redirect to post-auth registration
          router.push("/complete-registration");
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setError("Error checking account status. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (status === "authenticated") {
      checkUserExists();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="mb-4">Verifying your account...</div>
          <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full p-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <div className="mb-4">Redirecting...</div>
        <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function AuthRedirect() {
  return (
    <SessionProvider>
      <AuthRedirectContent />
    </SessionProvider>
  );
} 