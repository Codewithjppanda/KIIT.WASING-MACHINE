import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          hd: "kiit.ac.in"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // Only allow KIIT email addresses
        const email = profile?.email || '';
        if (!email.endsWith("@kiit.ac.in")) {
          // Deny sign in - NextAuth will redirect to /login?error=AccessDenied
          return false;
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
 