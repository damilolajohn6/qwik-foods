/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    points: 100, 
    duration: 15 * 60,
});

export function withRateLimit(handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return async (request: NextRequest, ...args: any[]) => {
        try {
            const ip = request.headers.get('x-forwarded-for') || 'anonymous';
            await rateLimiter.consume(ip);
            return await handler(request, ...args);
        } catch (error) {
            return NextResponse.json(
                { message: 'Too many requests' },
                { status: 429 }
            );
        }
    };
}