import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';

export async function GET() {
    await connectDB();
    const menuItems = await MenuItem.find();
    return NextResponse.json(menuItems);
}

export async function POST(request: Request) {
    await connectDB();
    const data = await request.json();
    const menuItem = new MenuItem(data);
    await menuItem.save();
    return NextResponse.json(menuItem, { status: 201 });
}
