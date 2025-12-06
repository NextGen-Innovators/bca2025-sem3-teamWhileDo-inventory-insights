import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

export const authOptions: any = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      authorization: {
        params: {
        scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, user }: { token: any; account?: any; user?: any }): Promise<any> {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }

      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;

        try {
          
          const response = await axios.post(
            "http://localhost:8000/users/save-token",
            {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              user: {
                id: user?.id || "",
                name: user?.name || "",
                email: user?.email || "",
                image: user?.image || null,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          

         
        } catch (error: any) {
          console.error("❌ Failed to save token to FastAPI:");
          if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
          } else {
            console.error("Error:", error.message);
          }
        }
      }
      
      return token;
    },

    async session({ session, token }: { session: any; token: any }): Promise<any> {
      session.access_token = token.access_token as string;
      session.refresh_token = token.refresh_token as string;
      session.expires_at = token.expires_at as number;

      if (token.user) {
        session.user = {
          id: token.user.id,
          name: token.user.name,
          email: token.user.email,
          image: token.user.image,
        };
      }

      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

const nextAuth = NextAuth(authOptions);
const { handlers } = nextAuth as any;
export const GET = handlers.GET;
export const POST = handlers.POST;