import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const vin = formData.get('vin') as string;
    const files = formData.getAll('files[]') as File[];

    if (!vin) {
      return NextResponse.json({ success: false, error: 'VIN required' }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    const newUrls: string[] = [];

    for (const file of files) {
      const path = `${vin}/${Date.now()}_${file.name}`;
      const buffer = await file.arrayBuffer();

      const { error: uploadError } = await supabaseAdmin.storage
        .from('vehicle-photos')
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('vehicle-photos')
        .getPublicUrl(path);

      newUrls.push(publicUrl);
    }

    // Fetch current photo_urls and append
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('inspections')
      .select('photo_urls')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) throw fetchError;

    const existing: string[] = Array.isArray(record?.photo_urls) ? record.photo_urls : [];

    const { error: patchError } = await supabaseAdmin
      .from('inspections')
      .update({ photo_urls: [...existing, ...newUrls] })
      .eq('vin', vin);

    if (patchError) throw patchError;

    return NextResponse.json({ success: true, urls: newUrls });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
