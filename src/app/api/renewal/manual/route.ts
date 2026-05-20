import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, days, reason } = body;

        if (!agentId || !days || !reason) {
            return NextResponse.json({ error: 'Agent ID, duration days, and override justification are required' }, { status: 400 });
        }

        const daysInt = parseInt(days);
        if (isNaN(daysInt) || daysInt <= 0) {
            return NextResponse.json({ error: 'Days must be a valid positive integer' }, { status: 400 });
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

        // 2. Fetch targeted agent details
        const { data: agent, error: agentErr } = await userClient
            .from('profiles')
            .select('id, name, subscription_expiry')
            .eq('id', agentId)
            .single();

        if (agentErr || !agent) {
            return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
        }

        // 3. Calculate New Expiration Timestamp
        const now = new Date();
        const currentExpiry = agent.subscription_expiry ? new Date(agent.subscription_expiry) : now;
        
        // Base start date is the current expiry if in the future, otherwise NOW
        const baseDate = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + daysInt);

        // 4. Update Agent Profile with extended manual subscription expiry
        const { error: updateProfileErr } = await userClient
            .from('profiles')
            .update({ subscription_expiry: newExpiry.toISOString() })
            .eq('id', agent.id);

        if (updateProfileErr) throw updateProfileErr;

        // 5. Insert manual override ledger entry into subscriptions table
        const { error: insertSubErr } = await userClient
            .from('subscriptions')
            .insert({
                agent_id: agent.id,
                start_date: baseDate.toISOString(),
                end_date: newExpiry.toISOString(),
                amount_paid: 0.00,
                payment_type: 'override',
                reason: `Manual override: ${reason}`
            });

        if (insertSubErr) throw insertSubErr;

        // 6. Log the action inside admin audit logs
        const { error: insertLogErr } = await userClient
            .from('admin_logs')
            .insert({
                admin_id: user.id,
                target_agent_id: agent.id,
                action: 'manual_override',
                details: {
                    previous_expiry: agent.subscription_expiry,
                    new_expiry: newExpiry.toISOString(),
                    days_added: daysInt,
                    reason: reason
                }
            });

        if (insertLogErr) throw insertLogErr;

        return NextResponse.json({
            success: true,
            message: `Successfully executed manual extension override for ${agent.name} by ${daysInt} days.`,
            newExpiry: newExpiry.toISOString()
        });

    } catch (error: any) {
        console.error('Manual Override API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Server error during manual override process' }, { status: 500 });
    }
}
