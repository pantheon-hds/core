import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, requireAdmin } from '../_shared/adminGuard.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://pantheonhds.com'

const REAPPLY_DAYS = 30 // keep in sync with REAPPLY_DAYS in src/services/supabase.ts

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    if (!await requireAdmin(req, supabase)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { waitlistId, rejectionReason } = await req.json()

    if (!waitlistId || !rejectionReason) {
      return new Response(
        JSON.stringify({ error: 'waitlistId and rejectionReason required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the waitlist entry
    const { data: entry, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('id', waitlistId)
      .single()

    if (fetchError || !entry) {
      return new Response(
        JSON.stringify({ error: 'Entry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rejectedAt = new Date()
    const reapplyDate = new Date(rejectedAt.getTime() + REAPPLY_DAYS * 24 * 60 * 60 * 1000)
    const reapplyStr = reapplyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    // Update waitlist entry
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        rejected_at: rejectedAt.toISOString(),
      })
      .eq('id', waitlistId)

    if (updateError) {
      console.error('Error updating waitlist:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send rejection email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pantheon <noreply@pantheonhds.com>',
        to: entry.email,
        subject: 'Your Pantheon Beta Application',
        html: `
          <div style="font-family: 'Courier New', monospace; background: #0a0a0f; color: #e8e0d0; padding: 48px 40px; max-width: 520px; margin: 0 auto;">
            <div style="font-size: 28px; color: #e8a830; margin-bottom: 32px; letter-spacing: 2px;">⚜ PANTHEON</div>

            <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #e8e0d0;">Thank you for applying.</p>
            <p style="color: #9a9080; margin-bottom: 28px; line-height: 1.6;">
              We've reviewed your application and are unable to invite you at this time.
            </p>

            <div style="background: #12121e; border: 0.5px solid #3a2a1a; padding: 20px 24px; margin-bottom: 28px;">
              <div style="color: #9a9080; font-size: 11px; letter-spacing: 3px; margin-bottom: 10px;">REASON</div>
              <div style="font-size: 15px; color: #c8b890; line-height: 1.6;">${rejectionReason}</div>
            </div>

            <div style="background: #12121e; border: 0.5px solid #2a2a3e; padding: 16px 24px; margin-bottom: 32px;">
              <div style="color: #9a9080; font-size: 11px; letter-spacing: 3px; margin-bottom: 8px;">YOU MAY REAPPLY AFTER</div>
              <div style="font-size: 16px; color: #e8a830; letter-spacing: 1px;">${reapplyStr}</div>
            </div>

            <p style="color: #9a9080; font-size: 13px; line-height: 1.7; margin-bottom: 32px;">
              This decision may change as the beta evolves. We encourage you to reapply — circumstances and tester needs shift over time.
            </p>

            <a href="${APP_URL}/beta" style="display: inline-block; color: #e8a830; padding: 12px 0; text-decoration: none; font-size: 13px; letter-spacing: 1px; border-bottom: 0.5px solid #e8a830;">
              Return to application page →
            </a>

            <div style="border-top: 0.5px solid #2a2a3e; margin-top: 40px; padding-top: 24px; color: #5a5048; font-size: 12px; line-height: 1.8;">
              Honor · Democracy · Skill<br/>
              Voland, Founder
            </div>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const emailError = await emailRes.text()
      console.error('Resend error:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Rejection sent to ${entry.email}, reason: ${rejectionReason}`)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
