import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Align with frontend formData keys from page.tsx
    const { 
      vin, year, make, modelPkg, body, miles, color, 
      autoManual, purchasedFrom, price, down, 
      paid, remarks, signature, date, checklist 
    } = data;

    // Safety for numeric parsing
    const safeParse = (val: string) => {
      if (!val || val.trim() === "") return 0;
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const { data: result, error } = await supabaseAdmin
      .from('inspections')
      .insert([
        { 
          vin, 
          year, 
          make, 
          model: modelPkg, 
          body, 
          miles, 
          color, 
          transmission: autoManual, 
          purchased_from: purchasedFrom, 
          price: safeParse(price), 
          down_payment: safeParse(down), 
          paid_status: paid, 
          remarks, 
          inspector_name: signature, 
          inspection_date: date,
          checklist: JSON.stringify(checklist) // Assuming a jsonb column or text
        }
      ])
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updateData } = await request.json();
    
    // Map frontend keys to DB columns
    const mappedData: any = {};
    if (updateData.year) mappedData.year = updateData.year;
    if (updateData.make) mappedData.make = updateData.make;
    if (updateData.modelPkg) mappedData.model = updateData.modelPkg;
    if (updateData.body) mappedData.body = updateData.body;
    if (updateData.miles) mappedData.miles = updateData.miles;
    if (updateData.color) mappedData.color = updateData.color;
    if (updateData.autoManual) mappedData.transmission = updateData.autoManual;
    if (updateData.vin) mappedData.vin = updateData.vin;
    if (updateData.purchasedFrom) mappedData.purchased_from = updateData.purchasedFrom;
    if (updateData.price) mappedData.price = parseFloat(updateData.price.replace(/[^0-9.]/g, "")) || 0;
    if (updateData.down) mappedData.down_payment = parseFloat(updateData.down.replace(/[^0-9.]/g, "")) || 0;
    if (updateData.paid) mappedData.paid_status = updateData.paid;
    if (updateData.remarks) mappedData.remarks = updateData.remarks;
    if (updateData.signature) mappedData.inspector_name = updateData.signature;
    if (updateData.date) mappedData.inspection_date = updateData.date;
    if (updateData.checklist) mappedData.checklist = JSON.stringify(updateData.checklist);

    const { error } = await supabaseAdmin
      .from('inspections')
      .update(mappedData)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const { error } = await supabaseAdmin
      .from('inspections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');
    const searchTerm = searchParams.get('search');

    let query = supabase.from('inspections').select('*');

    if (vin) {
      query = query.eq('vin', vin).order('created_at', { ascending: false }).limit(1);
    } else if (searchTerm) {
      const searchTerms = [searchTerm];
      const cleanSearch = searchTerm.replace(/[^a-zA-Z0-9]/g, "");
      if (cleanSearch !== searchTerm) searchTerms.push(cleanSearch);
      
      // If searchTerm has 4 numbers (like year) but is missing a hyphen, or has one, we can be clever.
      // For now, let's just do a multi-pattern search if they differ
      let orClause = `vin.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,year.ilike.%${searchTerm}%`;
      if (cleanSearch && cleanSearch !== searchTerm) {
        orClause += `,model.ilike.%${cleanSearch}%,make.ilike.%${cleanSearch}%`;
      }
      
      query = query.or(orClause)
                   .order('created_at', { ascending: false })
                   .limit(100);
    } else {
      query = query.order('created_at', { ascending: false }).limit(100);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
