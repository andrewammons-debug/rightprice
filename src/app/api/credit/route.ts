import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Higher privilege for encryption/SSN if needed, or use ANON
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Flatten or map data if needed. For now, we'll try to insert the whole object
    // Assuming a table 'credit_applications' exists with an 'id' and 'data' (JSONB) column
    // OR individual columns. Individual columns are better for searching.
    const { data: result, error } = await supabase
      .from('credit_applications')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('Credit submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await supabase
      .from('credit_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('credit_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
