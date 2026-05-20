import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
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

        // 1. Get current logged-in user and verify admin role
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

        // 3. Fetch targeted agent's current subscription expiry
        const { data: agent, error: agentErr } = await userClient
            .from('profiles')
            .select('id, name, subscription_expiry')
            .eq('id', request.agent_id)
            .single();

        if (agentErr || !agent) {
            return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
        }

        // 4. Calculate New Expiration Timestamp (+1 month extension)
        const now = new Date();
        const currentExpiry = agent.subscription_expiry ? new Date(agent.subscription_expiry) : now;
        
        // Base start date is the current expiry if in the future, otherwise NOW
        const baseDate = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        // 5. Update Agent Profile with extended subscription expiry
        const { error: updateProfileErr } = await userClient
            .from('profiles')
            .update({ subscription_expiry: newExpiry.toISOString() })
            .eq('id', agent.id);

        if (updateProfileErr) throw updateProfileErr;

        // 6. Update renewal_requests record status to approved
        const { error: updateRequestErr } = await userClient
            .from('renewal_requests')
            .update({
                status: 'approved',
                processed_at: now.toISOString(),
                processed_by: user.id
            })
            .eq('id', requestId);

        if (updateRequestErr) throw updateRequestErr;

        // 7. Insert payment ledger entry into subscriptions table
        const { error: insertSubErr } = await userClient
            .from('subscriptions')
            .insert({
                agent_id: agent.id,
                start_date: baseDate.toISOString(),
                end_date: newExpiry.toISOString(),
                amount_paid: 100.00,
                payment_type: 'payment',
                reason: 'Standard monthly UPI QR scan renewal.'
            });

        if (insertSubErr) throw insertSubErr;

        // 8. Log the admin action inside audit trail logs
        const { error: insertLogErr } = await userClient
            .from('admin_logs')
            .insert({
                admin_id: user.id,
                target_agent_id: agent.id,
                action: 'approve_renewal',
                details: {
                    previous_expiry: agent.subscription_expiry,
                    new_expiry: newExpiry.toISOString(),
                    request_id: requestId,
                    amount: 100.00
                }
            });

        if (insertLogErr) throw insertLogErr;

        return NextResponse.json({
            success: true,
            message: `Successfully approved and extended Agent ${agent.name} subscription by 1 month.`,
            newExpiry: newExpiry.toISOString()
        });

    } catch (error: any) {
        console.error('Approve API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Server error during approval process' }, { status: 500 });
    }
}
