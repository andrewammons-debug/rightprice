import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    
    // Translation Layer: React CamelCase -> Supabase snake_case
    const dbData = {
      vin: rawData.vin,
      safety_status: rawData.safetyStatus,
      checklist: typeof rawData.checklist === 'string' ? rawData.checklist : JSON.stringify(rawData.checklist),
      notes: rawData.notes,
      sublet_flag: rawData.subletFlag,
      cosmetic_notes: rawData.cosmeticNotes,
      parts_log: typeof rawData.partsLog === 'string' ? rawData.partsLog : JSON.stringify(rawData.partsLog || []),
      updated_at: new Date().toISOString()
    };
    
    // Check if record exists for this VIN, if so update, else insert
    const { data: existing } = await supabase
      .from('service_records')
      .select('id')
      .eq('vin', dbData.vin)
      .maybeSingle();

    let result;
    if (existing) {
      const { data: updateData, error } = await supabase
        .from('service_records')
        .update(dbData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = updateData;
    } else {
      const { data: insertData, error } = await supabase
        .from('service_records')
        .insert([dbData])
        .select()
        .single();
      if (error) throw error;
      result = insertData;
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('Service record submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin');

  const mapResult = (row: any) => {
    if (!row) return null;
    return {
      ...row,
      safetyStatus: row.safety_status,
      subletFlag: row.sublet_flag,
      cosmeticNotes: row.cosmetic_notes,
      partsLog: typeof row.parts_log === 'string' ? JSON.parse(row.parts_log) : (row.parts_log || []),
      checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist) : (row.checklist || {}),
      updatedAt: row.updated_at
    };
  };

  if (vin) {
    const { data, error } = await supabase
      .from('service_records')
      .select('*')
      .eq('vin', vin)
      .maybeSingle();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapResult(data));
  }

  // Get all records
  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ? data.map(mapResult) : []);
}
