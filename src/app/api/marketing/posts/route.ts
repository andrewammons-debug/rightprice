// Run this SQL in Supabase before using these routes:
//
// CREATE TABLE IF NOT EXISTS marketing_posts (
//   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   vin         text NOT NULL,
//   platform    text NOT NULL,
//   copy_type   text,
//   copy_text   text,
//   photo_urls  jsonb DEFAULT '[]',
//   external_post_id text,
//   status      text NOT NULL DEFAULT 'published',
//   created_at  timestamptz NOT NULL DEFAULT now()
// );
// CREATE INDEX IF NOT EXISTS marketing_posts_vin_idx ON marketing_posts (vin);

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');

    let query = supabaseAdmin
      .from('marketing_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (vin) query = query.eq('vin', vin);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('marketing_posts')
      .insert([{
        vin: body.vin,
        platform: body.platform,
        copy_type: body.copy_type ?? null,
        copy_text: body.copy_text ?? null,
        photo_urls: body.photo_urls ?? [],
        external_post_id: body.external_post_id ?? null,
        status: body.status ?? 'published',
      }])
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
