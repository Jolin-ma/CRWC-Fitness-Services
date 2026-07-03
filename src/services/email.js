const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends a transactional HTML email via the Resend API.
 * Falls back to a console log when RESEND_API_KEY is not configured,
 * so the booking/reminder flow works in local dev without email credentials.
 */
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "notifications@example.com";

  if (!apiKey) {
    console.log(`[email:stub] to=${to} subject="${subject}"`);
    return { stubbed: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${body}`);
  }

  return response.json();
}

export function sessionReminderEmail({ recipientName, otherPartyName, sessionTime }) {
  const formatted = new Date(sessionTime).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return {
    subject: `Reminder: your session is in 48 hours`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>This is a reminder that your fitness session with ${otherPartyName} is scheduled for:</p>
      <p><strong>${formatted}</strong></p>
      <p>Please arrive prepared and ready to train. See you there!</p>
    `,
  };
}
