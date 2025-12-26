'use client'
import dynamic from 'next/dynamic'

const CheckoutForm = dynamic(() => import('../../components/CheckoutForm'), {
  ssr: false,
  loading: () => <div className="p-12 text-center">Loading checkout...</div>
})

export default function CheckoutPage() {
  return <CheckoutForm />
}