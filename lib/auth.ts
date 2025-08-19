/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { AuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
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

                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await UserModel.findOne({ email: credentials.email });
                    if (
                        user &&
                        (await bcrypt.compare(credentials.password, user.password))
                    ) {
                        return {
                            id: user._id.toString(),
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        } as User & { role: string };
                    }
                    return null;
                } catch (error) {
                    console.error("Authentication error:", error);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        async session({
            session,
            token,
        }: {
            session: Session;
            token: JWT;
        }): Promise<Session> {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = token.role as string;
            }
            return session;
        },

        async jwt({
            token,
            user,
        }: {
            token: JWT;
            user?: User & { role?: string };
        }): Promise<JWT> {
            if (user) {
                token.sub = user.id;
                token.role = user.role ?? "user";
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