import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://pantheonhds.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { waitlistId, email } = await req.json()

    if (!waitlistId || !email) {
      return new Response(
        JSON.stringify({ error: 'waitlistId and email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Generate a short, readable invite code e.g. "A3F9-BK72-X1QM"
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase()
    const code = `${segment()}-${segment()}-${segment()}`

    // Save code
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
    await supabase
      .from('waitlist')
      .update({ status: 'approved' })
      .eq('id', waitlistId)

    // Send email via Resend
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
              ⚠ This code is single-use. Do not share it.
            </p>

            <a href="${APP_URL}/app" style="display: inline-block; background: #e8a830; color: #0a0a0f; padding: 14px 28px; text-decoration: none; font-weight: bold; font-family: monospace; letter-spacing: 1px; margin-top: 20px; margin-bottom: 36px;">
              Enter Pantheon →
            </a>

            <div style="border-top: 1px solid #2a2a3e; padding-top: 24px; color: #5a5048; font-size: 12px; line-height: 1.8;">
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
