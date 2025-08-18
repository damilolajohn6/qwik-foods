/* eslint-disable @typescript-eslint/no-explicit-any */
// auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { auth, signIn, signOut, handlers } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Replace with your real login logic
                if (
                    credentials?.email === "dailysflash@gmail.com" &&
                    credentials.password === "sweetmother#321"
                ) {
                    return { id: "1", name: "Admin", role: "admin" };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.role = (user as any).role;
            return token;
        },
        async session({ session, token }) {
            if (session.user) session.user.role = token.role as string;
            return session;
        },
    },
});
