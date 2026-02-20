import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Handle legacy admin routes
    if (pathname === '/admin/brokers') {
        return NextResponse.redirect(new URL('/admin?view=brokers', request.url));
    }

    if (pathname === '/admin/properties') {
        return NextResponse.redirect(new URL('/admin?view=properties', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/brokers', '/admin/properties'],
};
