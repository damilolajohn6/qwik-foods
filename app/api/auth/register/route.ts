/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterBodySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128),
    confirmPassword: z.string().min(1),
    // optional avatar base64 or data URL if you want to receive an avatar
    avatar: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = RegisterBodySchema.safeParse(body);

        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return NextResponse.json(
                { error: first.message, issues: parsed.error.issues },
                { status: 422 }
            );
        }


        const { name, email, password, confirmPassword, avatar } = parsed.data;

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: "Passwords do not match" },
                { status: 400 }
            );
        }

        await connectDB();

        // normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // check duplicate
        const existing = await UserModel.findOne({ email: normalizedEmail });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        // hash password
        const saltRounds = 10;
        const hashed = await bcrypt.hash(password, saltRounds);

        // Create user record
        const userDoc = await UserModel.create({
            name,
            email: normalizedEmail,
            password: hashed,
            // optional - add avatar if you support it (base64 -> upload to Cloudinary in a real app)
            ...(avatar ? { avatar } : {}),
        });

        // Optionally: send verification email or create email verification token
        // (stubbed here — implement with nodemailer / external service)
        // await sendVerificationEmail(userDoc);

        // Return minimal user info (DO NOT include password)
        return NextResponse.json(
            {
                message: "User created",
                user: { id: userDoc._id.toString(), name: userDoc.name, email: userDoc.email },
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("Register error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
