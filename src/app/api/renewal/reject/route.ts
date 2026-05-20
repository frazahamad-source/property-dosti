import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { requestId, reason } = body;

        if (!requestId || !reason) {
            return NextResponse.json({ error: 'Request ID and rejection reason are required' }, { status: 400 });
        }

        // Authenticate admin from Authorization header
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Create contextual client with caller's token to respect RLS
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        // 1. Verify admin role
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid auth session' }, { status: 401 });
        }

        const { data: adminProfile, error: profileErr } = await userClient
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileErr || !adminProfile?.is_admin) {
            return NextResponse.json({ error: 'Permission denied: Administrator role required' }, { status: 403 });
        }

        // 2. Fetch the corresponding renewal request
        const { data: request, error: reqErr } = await userClient
            .from('renewal_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (reqErr || !request) {
            return NextResponse.json({ error: 'Renewal request not found' }, { status: 404 });
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Renewal request has already been processed' }, { status: 400 });
        }

        const now = new Date();

        // 3. Update request status and record the rejection reason
        const { error: updateRequestErr } = await userClient
            .from('renewal_requests')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                processed_at: now.toISOString(),
                processed_by: user.id
            })
            .eq('id', requestId);

        if (updateRequestErr) throw updateRequestErr;

        // 4. Log the action inside admin audit logs
        const { error: insertLogErr } = await userClient
            .from('admin_logs')
            .insert({
                admin_id: user.id,
                target_agent_id: request.agent_id,
                action: 'reject_renewal',
                details: {
                    request_id: requestId,
                    reason: reason
                }
            });

        if (insertLogErr) throw insertLogErr;

        return NextResponse.json({
            success: true,
            message: 'Subscription renewal request has been disapproved successfully.'
        });

    } catch (error: any) {
        console.error('Reject API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Server error during rejection process' }, { status: 500 });
    }
}
