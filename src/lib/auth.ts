import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import SlackProvider from "next-auth/providers/slack";
import RedditProvider from "next-auth/providers/reddit";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import clientPromise from "./mongodb";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
    RedditProvider({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    }),    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { db } = await connectToDatabase();
          const user = await db.collection("users").findOne({
            email: credentials.email
          });

          if (!user) {
            return null;
          }

          if (user.password && !user.emailVerified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar?.secure_url || user.image || null,
          };        } catch (error) {
          console.error("Authorization error:", error);
          if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
            throw error;
          }
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },  pages: {
    signIn: "/auth/signin",
  },  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      
      // Always fetch fresh user data to get updated avatar
      if (token.email) {
        try {
          const { db } = await connectToDatabase();
          const dbUser = await db.collection("users").findOne({
            email: token.email
          });
          if (dbUser?.avatar?.secure_url) {
            token.image = dbUser.avatar.secure_url;
          }
        } catch (error) {
          console.error("Error fetching user avatar:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
};
