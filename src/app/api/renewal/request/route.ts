import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, notes } = body;

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        // Extract and verify Authorization token if present
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (token) {
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
                return NextResponse.json({ error: 'Invalid or expired auth session' }, { status: 401 });
            }
            if (user.id !== agentId) {
                return NextResponse.json({ error: 'Unauthorized: Agent ID mismatch' }, { status: 403 });
            }
        }

        // Insert pending renewal request into the database
        const { data, error } = await supabase
            .from('renewal_requests')
            .insert({
                agent_id: agentId,
                status: 'pending',
                notes: notes || 'Semi-automated payment intimated by agent.',
                intimated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating renewal request:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Renewal payment intimation request successfully registered.',
            data
        });

    } catch (error: any) {
        console.error('Renewal Request API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit renewal request' }, { status: 500 });
    }
}
