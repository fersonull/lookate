// NextAuth Configuration
import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { MongooseUserRepository } from "@/lib/infrastructure/database/repository/mongoose-user-repository";
import { signInSchema } from "@/lib/application/schemas/auth-schemas";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

const userRepository = new MongooseUserRepository();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // Email/Password Authentication
    CredentialsProvider({
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
          // Validate input
          const validatedFields = signInSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          // Find user
          const user = await userRepository.findByEmail(credentials.email);
          if (!user || !user.passwordHash) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),

    // Google OAuth (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          })
        ]
      : []),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user exists in our database
      if (account?.provider === "google" && profile?.email) {
        try {
          let existingUser = await userRepository.findByEmail(profile.email);
          
          if (!existingUser) {
            // Create user from OAuth profile
            existingUser = await userRepository.create({
              email: profile.email,
              name: profile.name || "Unknown User",
              avatar: profile.image,
              // No password hash for OAuth users
            });
          }
          
          // Update user ID for session
          user.id = existingUser.id;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }

      return true;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  events: {
    async signIn({ user }) {
      // Update user's last active time
      if (user.id) {
        try {
          await userRepository.update(user.id, {
            updatedAt: new Date(),
          });
        } catch (error) {
          console.error("Error updating user last active:", error);
        }
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
};