"use client";

import { useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/ui/button";

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
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rollNo">Roll Number</Label>
            <Input
              id="rollNo"
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Roll Number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="Mobile Number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="floor">Hostel Floor</Label>
            <div className="group/input rounded-lg p-[2px] transition duration-300 bg-blue-500/5 hover:bg-blue-500/10">
              <select
                id="floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="shadow-input flex w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600"
                required
              >
                <option value="4th Floor">4th Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="Ground Floor">Ground Floor</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Password"
              required
            />
          </div>
          
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={isLoading}
            className="w-full mt-6"
          >
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </Button>
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