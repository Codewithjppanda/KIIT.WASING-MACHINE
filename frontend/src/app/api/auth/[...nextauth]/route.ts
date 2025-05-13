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
        // Only verify KIIT email - we'll check registration status later
        const isKiitEmail = profile?.email?.endsWith("@kiit.ac.in");
        if (!isKiitEmail) {
          throw new Error("Please use your KIIT email address (@kiit.ac.in)");
        }
        
        return true;
      }
      return false;
    },
    async redirect({ baseUrl }) {
      // Redirect to a new route that will check if user exists and redirect accordingly
      return `${baseUrl}/auth-redirect`;
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
