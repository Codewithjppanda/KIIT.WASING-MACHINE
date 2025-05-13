"use client";

import { useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

function CompleteRegistrationContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [floor, setFloor] = useState("3rd Floor");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      setError("You must be logged in with Google to complete registration");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          email: session.user.email,
          password: password,
          mobileNumber: mobileNumber,
          rollNo: rollNo,
          floor: floor
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", session.user.email);
        localStorage.setItem("userName", `${firstName} ${lastName}`);
        localStorage.setItem("userFloor", floor);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Complete Your Registration</h2>
        <p className="text-gray-400 mb-6">
          Please provide the additional details to complete your account setup
        </p>
        
        {session?.user?.email && (
          <div className="mb-6 p-3 bg-blue-500/20 text-blue-300 rounded-lg">
            <p>Signed in as: {session.user.email}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white"
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white"
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white"
              placeholder="Roll Number"
              required
            />
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white"
              placeholder="Mobile Number"
              required
            />
          </div>
          
          <div className="mb-4">
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white"
              required
            >
              <option value="4th Floor">4th Floor</option>
              <option value="3rd Floor">3rd Floor</option>
              <option value="2nd Floor">2nd Floor</option>
              <option value="1st Floor">1st Floor</option>
              <option value="Ground Floor">Ground Floor</option>
            </select>
          </div>
          
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white"
              placeholder="Create Password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CompleteRegistration() {
  return (
    <SessionProvider>
      <CompleteRegistrationContent />
    </SessionProvider>
  );
} 