import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // First verify KIIT email
        const isKiitEmail = profile?.email?.endsWith("@kiit.ac.in");
        if (!isKiitEmail) {
          throw new Error("Please use your KIIT email address (@kiit.ac.in)");
        }
        
        // Check if user exists in database
        try {
          const response = await fetch(`http://localhost:5000/api/users/check-email?email=${profile?.email}`);
          
          // If response is not ok (non-200 status), throw error
          if (!response.ok) {
            console.error("Backend error:", await response.text());
            throw new Error("Unable to verify email. Please try again later.");
          }
          
          const data = await response.json();
          
          if (!data.exists) {
            throw new Error("Please register first before logging in");
          }
          
          return true;
        } catch (error) {
          console.error("Email verification error:", error);
          throw error;
        }
      }
      return false;
    },
    async redirect({ baseUrl }) {
      // Always redirect to login page after Google authentication
      return `${baseUrl}/login`;
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
