/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await connectDB();

                if (!credentials?.email || !credentials?.password) return null;

                const user = await UserModel.findOne({ email: credentials.email });
                if (user && (await bcrypt.compare(credentials.password, user.password))) {
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                }
                return null;
            },
        }),
    ],

    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                token.role = (user as any).role ?? "user";
            }
            return token;
        },
    },

    pages: {
        signIn: "/auth/signin",
    },

    session: {
        strategy: "jwt",
    },
};
