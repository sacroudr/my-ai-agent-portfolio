import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    if (!process.env.CONTACT_EMAIL) {
      throw new Error("Missing CONTACT_EMAIL");
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AI Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_EMAIL],
        reply_to: email,
        subject: `[AI Portfolio] New message from ${name}`,
        html: `
          <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 32px; background: #09090b; color: #fafafa; border-radius: 8px;">
            
            <div style="border-left: 3px solid #06B6D4; padding-left: 16px; margin-bottom: 32px;">
              <p style="margin: 0; font-size: 11px; color: #71717a; letter-spacing: 0.1em; text-transform: uppercase;">
                AI Portfolio — New Contact
              </p>
              <h1 style="margin: 8px 0 0; font-size: 20px; color: #fafafa; font-weight: 400;">
                Message from ${name}
              </h1>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 12px; color: #71717a; width: 80px; vertical-align: top;">FROM</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 13px; color: #fafafa;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 12px; color: #71717a; vertical-align: top;">EMAIL</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 13px;">
                  <a href="mailto:${email}" style="color: #06B6D4; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-size: 12px; color: #71717a; vertical-align: top; padding-top: 16px;">MESSAGE</td>
                <td style="padding: 10px 0; padding-top: 16px; font-size: 13px; color: #d4d4d8; line-height: 1.7; white-space: pre-wrap;">${message.trim()}</td>
              </tr>
            </table>

            <div style="margin-top: 32px; padding: 12px 16px; background: #111113; border-radius: 6px; border: 1px solid #27272a;">
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                Sent via your AI Portfolio Agent · 
                <a href="mailto:${email}" style="color: #06B6D4; text-decoration: none;">Reply directly to ${name}</a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[/api/contact] Resend error:", error);
      throw new Error(`Resend API error: ${response.status}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/contact] Error:", message);
    return new Response(
      JSON.stringify({ error: "Failed to send message. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}