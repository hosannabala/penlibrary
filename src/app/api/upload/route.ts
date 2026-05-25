import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const supabase = createServerClient()

    const { error: uploadError } = await supabase.storage
      .from('Covers')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('Covers').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('Upload error:', error)
    const msg = error?.message?.includes('Bucket not found')
      ? 'Storage bucket "covers" not found. Create it in Supabase Dashboard → Storage → New Bucket (name: covers, public: true).'
      : (error.message || 'Upload failed')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
