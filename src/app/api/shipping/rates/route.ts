import { NextResponse } from 'next/server'

const SHIPBUBBLE_BASE = 'https://api.shipbubble.com/v1'

// Module-level cache so the store address is only validated once per server instance
let cachedSenderCode: number | null = null

class AddressValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AddressValidationError'
  }
}

async function validateAddress(address: string, name: string, phone: string, email: string): Promise<number> {
  const res = await fetch(`${SHIPBUBBLE_BASE}/shipping/address/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, phone, address }),
  })
  const data = await res.json()
  if (!res.ok || !data?.data?.address_code) {
    throw new AddressValidationError(data?.message ?? 'Address validation failed')
  }
  return data.data.address_code as number
}

async function getSenderCode(): Promise<number> {
  // Use pre-configured address code if available (saves validation credits)
  const envCode = process.env.SHIPBUBBLE_SENDER_ADDRESS_CODE
  if (envCode) return parseInt(envCode, 10)

  if (cachedSenderCode) return cachedSenderCode

  const code = await validateAddress(
    process.env.SHIPBUBBLE_STORE_ADDRESS ?? 'Pen Library Services, Port Harcourt, Rivers State, Nigeria',
    'Pen Library Services',
    process.env.SHIPBUBBLE_STORE_PHONE ?? '+2348000000000',
    process.env.SHIPBUBBLE_STORE_EMAIL ?? 'penlibrary@email.com',
  )
  cachedSenderCode = code
  return code
}

export async function POST(req: Request) {
  try {
    const { customerAddress, customerName, customerPhone, customerEmail, itemCount } = await req.json()

    if (!process.env.SHIPBUBBLE_API_KEY) {
      return NextResponse.json({ error: 'Shipbubble not configured' }, { status: 500 })
    }
    if (!customerAddress || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Address, name and phone are required' }, { status: 400 })
    }

    // Validate both addresses in parallel
    const [senderCode, receiverCode] = await Promise.all([
      getSenderCode(),
      validateAddress(customerAddress, customerName, customerPhone, customerEmail || 'customer@penlibrary.ng'),
    ])

    const pickupDate = new Date()
    pickupDate.setDate(pickupDate.getDate() + 1)
    const pickup = pickupDate.toISOString().split('T')[0]

    // Estimate package weight: 0.4 kg per book, min 0.5 kg
    const weightKg = Math.max(0.5, (itemCount ?? 1) * 0.4)

    const ratesRes = await fetch(`${SHIPBUBBLE_BASE}/shipping/fetch_rates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_address_code: senderCode,
        receiver_address_code: receiverCode,
        pickup_date: pickup,
        category_id: 1,
        package_items: [
          {
            name: 'Books',
            description: 'Books from Pen Library Services',
            unit_weight: weightKg,
            unit_amount: 2000,
            quantity: itemCount ?? 1,
          },
        ],
        package_dimension: { length: 25, width: 20, height: Math.ceil((itemCount ?? 1) * 3) },
      }),
    })

    const ratesData = await ratesRes.json()

    if (!ratesRes.ok || !ratesData?.data?.couriers) {
      throw new Error(ratesData?.message ?? 'Could not fetch shipping rates')
    }

    const couriers = (ratesData.data.couriers as any[]).map(c => ({
      courierId: c.courier_id,
      serviceCode: c.service_code,
      name: c.courier_name,
      fee: Math.round(Number(c.total_cost)),
      deliveryEta: c.delivery_eta_string ?? '',
      pickupEta: c.pickup_eta_string ?? '',
    }))

    return NextResponse.json({
      couriers,
      requestToken: ratesData.data.request_token,
      receiverAddressCode: receiverCode,
    })
  } catch (error: any) {
    console.error('Shipbubble rates error:', error)
    const isValidationError = error?.name === 'AddressValidationError'
    const status = isValidationError ? 400 : 500
    const message = isValidationError
      ? `Could not verify your address: ${error.message}. Please make sure your street, city and state are correct.`
      : (error.message || 'Failed to get shipping rates')
    return NextResponse.json({ error: message }, { status })
  }
}
