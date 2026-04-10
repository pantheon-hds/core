import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, requireAdmin } from '../_shared/adminGuard.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://pantheonhds.com'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const sessionToken = req.headers.get('x-session-token')
    console.log('send-invite: x-session-token present:', !!sessionToken, '| length:', sessionToken?.length ?? 0)

    if (!await requireAdmin(req, supabase)) {
      console.log('send-invite: requireAdmin failed')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { waitlistId, email } = await req.json()

    if (!waitlistId || !email) {
      return new Response(
        JSON.stringify({ error: 'waitlistId and email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a cryptographically secure invite code e.g. "A3F9-BK72-X1QM"
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
    const segment = () => {
      const bytes = new Uint8Array(4)
      crypto.getRandomValues(bytes)
      return Array.from(bytes).map(b => CHARS[b % CHARS.length]).join('')
    }
    const code = `${segment()}-${segment()}-${segment()}`

    // Send email FIRST — only save code if delivery succeeds
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pantheon <noreply@pantheonhds.com>',
        to: email,
        subject: "You're in — Pantheon Beta Invite",
        html: `
          <div style="font-family: 'Courier New', monospace; background: #0a0a0f; color: #e8e0d0; padding: 48px 40px; max-width: 520px; margin: 0 auto;">
            <div style="font-size: 28px; color: #e8a830; margin-bottom: 32px; letter-spacing: 2px;">⚜ PANTHEON</div>

            <p style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">You're in.</p>
            <p style="color: #9a9080; margin-bottom: 36px; line-height: 1.6;">
              Your application was reviewed and accepted.<br/>
              Use the code below to enter Pantheon Beta.
            </p>

            <div style="background: #12121e; border: 1px solid #e8a830; padding: 24px; text-align: center; margin-bottom: 36px;">
              <div style="color: #9a9080; font-size: 11px; letter-spacing: 3px; margin-bottom: 12px;">INVITE CODE</div>
              <div style="font-size: 26px; letter-spacing: 6px; color: #e8a830; font-weight: bold;">${code}</div>
            </div>

            <p style="color: #9a9080; font-size: 13px; margin-bottom: 8px;">
              &#9888; This code is single-use. Do not share it.
            </p>

            <a href="${APP_URL}/app" style="display: inline-block; background: #e8a830; color: #0a0a0f; padding: 14px 28px; text-decoration: none; font-weight: bold; font-family: monospace; letter-spacing: 1px; margin-top: 20px; margin-bottom: 24px;">
              Enter Pantheon &rarr;
            </a>

            <div style="background: #12121e; border: 1px solid #2a2a3e; padding: 16px 24px; margin-bottom: 36px;">
              <div style="color: #9a9080; font-size: 11px; letter-spacing: 3px; margin-bottom: 8px;">BETA DISCORD</div>
              <a href="https://discord.gg/tJYdSHYw" style="color: #e8a830; font-size: 14px; text-decoration: none; letter-spacing: 1px;">discord.gg/tJYdSHYw</a>
              <p style="color: #5a5048; font-size: 12px; margin: 6px 0 0;">Closed server — beta testers only.</p>
            </div>

            <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; color: #5a5048; font-size: 12px; line-height: 1.8;">
              Honor &middot; Democracy &middot; Skill<br/>
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

    // Email delivered — now save the code and mark as approved
    const { error: codeError } = await supabase
      .from('invite_codes')
      .insert({ code, email })

    if (codeError) {
      console.error('Error saving invite code:', codeError)
      return new Response(
        JSON.stringify({ error: codeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark waitlist entry as approved
    const { error: waitlistError } = await supabase
      .from('waitlist')
      .update({ status: 'approved' })
      .eq('id', waitlistId)

    if (waitlistError) {
      console.error('Error updating waitlist status:', waitlistError)
      // Non-fatal — code was sent, just log the error
    }

    console.log(`Invite sent to ${email}, code: ${code}`)

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
