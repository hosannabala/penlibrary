// Email utility using Resend (https://resend.com)
// Set RESEND_API_KEY in .env.local to activate. Gracefully skips if not configured.

type OrderEmailData = {
  to: string
  customerName: string
  orderRef: string
  items: { title: string; quantity: number; price: number }[]
  total: number
  deliveryMethod: 'delivery' | 'pickup'
  shippingAddress?: string
}

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(i => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${i.title}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center">×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${formatNGN(i.price * i.quantity)}</td>
    </tr>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed</title></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e8e8e8">
    <div style="background:#1E3777;padding:32px 40px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.05em">PEN LIBRARY SERVICES</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:0.1em;text-transform:uppercase">Order Confirmed</p>
    </div>
    <div style="padding:32px 40px">
      <p style="margin:0 0 24px;color:#2E2E2E;font-size:15px">Hi ${data.customerName},</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6">
        Thank you for your order! We've received your payment and are processing your books.
      </p>

      <div style="background:#f9f9f9;border-left:3px solid #F07A22;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em">Order Reference</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#2E2E2E;font-family:monospace">${data.orderRef}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;color:#2E2E2E">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #1E3777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999">Book</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #1E3777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #1E3777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:12px;font-weight:700;font-size:15px">Total</td>
            <td style="padding-top:12px;font-weight:700;font-size:15px;text-align:right;color:#F07A22">${formatNGN(data.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#f9f9f9;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#555">
        <strong style="color:#2E2E2E">Delivery:</strong>
        ${data.deliveryMethod === 'pickup'
          ? 'Free pickup — Okuru-Ama, Port Harcourt, Rivers State'
          : data.shippingAddress ?? 'Address on file'}
      </div>

      <p style="font-size:13px;color:#888;line-height:1.6">
        Keep your order reference safe. You can track your order at any time by visiting your account dashboard.
      </p>
    </div>
    <div style="background:#f4f4f4;padding:20px 40px;border-top:1px solid #e8e8e8;text-align:center">
      <p style="margin:0;font-size:12px;color:#aaa">
        Pen Library Services · Okuru-Ama, Port Harcourt, Rivers State, Nigeria<br>
        <a href="https://instagram.com/pen_library_services" style="color:#F07A22;text-decoration:none">@pen_library_services</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not set — skipping order confirmation email for', data.to)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pen Library Services <orders@penlibrary.ng>',
      to: [data.to],
      subject: `Order Confirmed — ${data.orderRef}`,
      html: buildOrderEmailHtml(data),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Failed to send order confirmation:', body)
  }
}
