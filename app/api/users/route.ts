import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import Pusher from "pusher";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

// ===== Validation Schema =====
const UserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).optional(),
    role: z.enum(["user", "admin"]).optional(),
});

// ===== GET - List Users (Admin Only) =====
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const users = await User.find().select("-password");
    return NextResponse.json(users);
}

// ===== POST - Create User =====
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Allow both Admin creating accounts or open registration if no session
    const allowOpenRegistration = !session;
    const isAdmin = session?.user.role === "admin";
    if (!allowOpenRegistration && !isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UserSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message, issues: parsed.error.issues },
            { status: 422 }
        );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: parsed.data.email });
    if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = parsed.data.password
        ? await bcrypt.hash(parsed.data.password, 10)
        : undefined;

    const newUser = await User.create({
        ...parsed.data,
        password: hashedPassword,
    });

    await pusher.trigger("users", "user-added", User);

    return NextResponse.json(
        { message: "User created successfully", user: { ...newUser.toObject(), password: undefined } },
        { status: 201 }
    );
}

// ===== PATCH - Update User (Self or Admin) =====
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UserSchema.partial().safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message, issues: parsed.error.issues },
            { status: 422 }
        );
    }

    await connectDB();

    const userIdToUpdate = body.id || session.user.id;

    // Only allow self-update unless admin
    if (session.user.role !== "admin" && userIdToUpdate !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData = { ...parsed.data };

    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userIdToUpdate,
        updateData,
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await pusher.trigger("users", "user-updated", updatedUser);


    return NextResponse.json({ message: "User updated", user: updatedUser });
}

// ===== DELETE - Delete User (Admin Only) =====
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    await connectDB();
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await pusher.trigger("users", "user-deleted", { id });

    return NextResponse.json({ message: "User deleted successfully" });
}
