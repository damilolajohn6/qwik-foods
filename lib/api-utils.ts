/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Standard API Response Interface
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: any;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        nextPage?: number;
        prevPage?: number;
    };
    meta?: any;
}

// Custom Error Classes
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class ValidationError extends ApiError {
    constructor(message: string, public errors: any) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends ApiError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends ApiError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends ApiError {
    constructor() {
        super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

// Success Response Helper
export function createSuccessResponse<T>(
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: any
): NextResponse {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
        meta
    };

    return NextResponse.json(response, { status: statusCode });
}

// Error Response Helper
export function createErrorResponse(
    message: string,
    statusCode: number = 500,
    errors?: any,
    code?: string
): NextResponse {
    const response: ApiResponse = {
        success: false,
        message,
        error: message,
        errors,
        ...(code && { code })
    };

    return NextResponse.json(response, { status: statusCode });
}

// Comprehensive Error Handler
export function handleApiError(error: any): NextResponse {
    console.error('API Error:', error);

    // Handle custom API errors
    if (error instanceof ApiError) {
        return createErrorResponse(
            error.message,
            error.statusCode,
            error instanceof ValidationError ? error.errors : undefined,
            error.code
        );
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const formattedErrors = error.issues.reduce((acc, err) => {
            const path = err.path.join('.');
            acc[path] = err.message;
            return acc;
        }, {} as Record<string, string>);

        return createErrorResponse(
            'Validation failed',
            400,
            formattedErrors,
            'VALIDATION_ERROR'
        );
    }

    // Handle MongoDB errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return createErrorResponse(
                `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
                409,
                undefined,
                'DUPLICATE_ERROR'
            );
        }

        if (error.code === 121) {
            // Document validation error
            return createErrorResponse(
                'Document validation failed',
                400,
                error.errInfo?.details?.schemaRulesNotSatisfied,
                'DOCUMENT_VALIDATION_ERROR'
            );
        }
    }

    if (error.name === 'CastError') {
        return createErrorResponse(
            'Invalid data format',
            400,
            { [error.path]: `Invalid ${error.kind}` },
            'CAST_ERROR'
        );
    }

    if (error.name === 'ValidationError') {
        const errors = Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
        }, {} as Record<string, string>);

        return createErrorResponse(
            'Validation failed',
            400,
            errors,
            'MONGOOSE_VALIDATION_ERROR'
        );
    }

    // Handle network and connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
        return createErrorResponse(
            'Database connection error',
            503,
            undefined,
            'DATABASE_CONNECTION_ERROR'
        );
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return createErrorResponse(
            'Invalid token',
            401,
            undefined,
            'INVALID_TOKEN'
        );
    }

    if (error.name === 'TokenExpiredError') {
        return createErrorResponse(
            'Token expired',
            401,
            undefined,
            'TOKEN_EXPIRED'
        );
    }

    // Default error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    return createErrorResponse(
        isDevelopment ? error.message : 'Internal server error',
        500,
        isDevelopment ? { stack: error.stack } : undefined,
        'INTERNAL_SERVER_ERROR'
    );
}

// Query Parameter Helpers
export function parseQueryParams(searchParams: URLSearchParams) {
    const params: Record<string, any> = {};

    for (const [key, value] of searchParams.entries()) {
        // Handle boolean values
        if (value === 'true') {
            params[key] = true;
        } else if (value === 'false') {
            params[key] = false;
        }
        // Handle numbers
        else if (!isNaN(Number(value)) && value !== '') {
            params[key] = Number(value);
        }
        // Handle arrays (comma-separated)
        else if (value.includes(',')) {
            params[key] = value.split(',').map(v => v.trim());
        }
        // Handle empty strings
        else if (value === '') {
            params[key] = undefined;
        }
        // Default string handling
        else {
            params[key] = value;
        }
    }

    return params;
}

// Pagination Helper
export function createPaginationMeta(
    page: number,
    limit: number,
    total: number
) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
    };
}

// Request Validation Wrapper
export function validateRequest<T>(
    schema: any,
    data: any
): { success: true; data: T } | { success: false; error: ZodError } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: result.error };
    }
}

// Cache Control Helper
export function setCacheHeaders(
    response: NextResponse,
    options: {
        maxAge?: number;
        sMaxAge?: number;
        staleWhileRevalidate?: number;
        noCache?: boolean;
        private?: boolean;
    } = {}
) {
    const {
        maxAge = 60,
        sMaxAge = 60,
        staleWhileRevalidate = 300,
        noCache = false,
        private: isPrivate = false
    } = options;

    if (noCache) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else {
        const cacheDirectives = [
            isPrivate ? 'private' : 'public',
            `max-age=${maxAge}`,
            `s-maxage=${sMaxAge}`,
            `stale-while-revalidate=${staleWhileRevalidate}`
        ];

        response.headers.set('Cache-Control', cacheDirectives.join(', '));
    }

    return response;
}

// Rate Limiting Helper
export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
}

// Simple in-memory rate limiter (for demonstration - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
    const { windowMs = 60000, max = 100 } = options; // Default: 100 requests per minute
    const now = Date.now();
    const key = identifier;

    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
        // First request or window expired
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: max - 1, resetTime: now + windowMs };
    }

    if (current.count >= max) {
        // Rate limit exceeded
        return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    // Increment count
    current.count++;
    rateLimitMap.set(key, current);

    return { allowed: true, remaining: max - current.count, resetTime: current.resetTime };
}

// Clean up old rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 300000); // Clean up every 5 minutes

// Database Connection Helper with Retry Logic
export async function connectWithRetry(
    connectDB: () => Promise<void>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<void> {
    let lastError: Error = new Error('Unknown connection error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await connectDB();
            return; // Success
        } catch (error) {
            lastError = error as Error;
            console.warn(`Database connection attempt ${attempt} failed:`, error);

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    throw new ApiError(
        `Failed to connect to database after ${maxRetries} attempts: ${lastError.message}`,
        503,
        'DATABASE_CONNECTION_FAILED'
    );
}

// Request Logging Helper
export function logRequest(request: Request, startTime: number) {
    const duration = Date.now() - startTime;
    const { method, url } = request;

    console.log(`${method} ${url} - ${duration}ms`);
}

// Async Handler Wrapper
export function asyncHandler(
    handler: (request: Request, context?: any) => Promise<NextResponse>
) {
    return async (request: Request, context?: any): Promise<NextResponse> => {
        const startTime = Date.now();

        try {
            const response = await handler(request, context);
            logRequest(request, startTime);
            return response;
        } catch (error) {
            logRequest(request, startTime);
            return handleApiError(error);
        }
    };
}

// Data Sanitization Helper
export function sanitizeData(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data === 'string') {
        // Basic HTML sanitization
        return data
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    }

    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }

    if (typeof data === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeData(value);
        }
        return sanitized;
    }

    return data;
}

// File Upload Validation Helper
export function validateFileUpload(
    file: File,
    options: {
        maxSize?: number;
        allowedTypes?: string[];
        allowedExtensions?: string[];
    } = {}
): { valid: boolean; error?: string } {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    } = options;

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} is not allowed`
        };
    }

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `File extension ${extension} is not allowed`
        };
    }

    return { valid: true };
}

// Environment Configuration Helper
export const config = {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    databaseUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    uploadDir: process.env.UPLOAD_DIR || './public/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
        max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests
    },
    cache: {
        defaultTTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
        longTTL: parseInt(process.env.CACHE_LONG_TTL || '3600'), // 1 hour
    }
};

// Response Headers Helper
export function setSecurityHeaders(response: NextResponse): NextResponse {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // API-specific headers
    response.headers.set('X-API-Version', '1.0');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
}

// Database Query Helper
export class QueryBuilder {
    private filter: any = {};
    private sortOptions: any = {};
    private selectFields: string[] = [];
    private populateFields: string[] = [];
    private pageNumber: number = 1;
    private limitNumber: number = 10;

    where(conditions: any): QueryBuilder {
        this.filter = { ...this.filter, ...conditions };
        return this;
    }

    search(query: string, fields: string[] = ['name', 'description']): QueryBuilder {
        if (query) {
            const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            this.filter.$or = fields.map(field => ({ [field]: { $regex: searchRegex } }));
        }
        return this;
    }

    sort(field: string, order: 'asc' | 'desc' = 'asc'): QueryBuilder {
        this.sortOptions[field] = order === 'asc' ? 1 : -1;
        return this;
    }

    select(fields: string[]): QueryBuilder {
        this.selectFields = fields;
        return this;
    }

    populate(fields: string[]): QueryBuilder {
        this.populateFields = fields;
        return this;
    }

    paginate(page: number, limit: number): QueryBuilder {
        this.pageNumber = Math.max(1, page);
        this.limitNumber = Math.min(100, Math.max(1, limit)); // Max 100 per page
        return this;
    }

    build() {
        return {
            filter: this.filter,
            sort: this.sortOptions,
            select: this.selectFields.length > 0 ? this.selectFields.join(' ') : undefined,
            populate: this.populateFields,
            skip: (this.pageNumber - 1) * this.limitNumber,
            limit: this.limitNumber,
            page: this.pageNumber
        };
    }
}
