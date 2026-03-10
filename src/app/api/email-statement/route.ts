import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, agentName, periodLabel, dateRangeStr, statementData } = body;

        if (!email || !statementData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // --- PRODUCTION NOTE ---
        // At this point, you would integrate a service like Resend, SendGrid, or AWS SES.
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //     from: 'onboarding@resend.dev',
        //     to: email,
        //     subject: `Commission Statement - ${agentName} (${periodLabel})`,
        //     html: `<p>Your commission statement for ${dateRangeStr} is attached.</p>`,
        //     attachments: [{ filename: 'statement.pdf', content: buffer }]
        // });

        console.log(`[MOCK EMAIL SENT] To: ${email} | Subject: Commission Statement - ${periodLabel} | Period: ${dateRangeStr}`);

        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({
            success: true,
            message: `Mock email statement successfully sent to ${email}`
        });

    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
