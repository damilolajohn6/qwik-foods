/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET() {
    await connectDB();

    try {
        const totalMenuItems = await MenuItem.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const salesByDay = await Order.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$total" },
                },
            },
            { $sort: { _id: 1 } },
        ]).limit(7);

        return NextResponse.json({
            totalMenuItems,
            totalOrders,
            totalUsers,
            ordersByStatus: Object.fromEntries(
                ordersByStatus.map((s) => [s._id, s.count])
            ),
            salesByDay,
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
