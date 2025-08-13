import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Menu from '@/models/MenuItem';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    await connectDB();

    try {
        const menuItem = await Menu.findById(params.id);
        if (!menuItem) {
            return NextResponse.json(
                { message: 'Menu item not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(menuItem);
    } catch (error) {
        return NextResponse.json(
            { message: 'Server error', error },
            { status: 500 }
        );
    }
}