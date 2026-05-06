import { NextResponse } from 'next/server';

// This is the absolute most stable way to write a Next.js route handler.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');

    if (!vin) {
      return new Response(JSON.stringify({ error: 'VIN is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = `https://auto.dev/api/vin/${vin}`;
    
    // Using Auto.dev API for high-fidelity Trim and option packaging
    let response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.AUTO_DEV_API_KEY}`
      }
    });

    let data = await response.json();

    // FALLBACK LOGIC: If Auto.dev fails or doesn't find the vehicle, try NHTSA immediately.
    if (!response.ok || data.status === "NOT_FOUND" || !data.make) {
       console.log("Auto.dev failed or not found, falling back to NHTSA...");
       const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;
       const nhtsaRes = await fetch(nhtsaUrl);
       if (nhtsaRes.ok) {
          data = await nhtsaRes.json();
       }
    }

    // FINAL SAFETY: If we still don't have usable data after the fallback, return a clean error
    if (!data || (!data.make && (!data.Results || !data.Results[0]))) {
      return new Response(JSON.stringify({ error: 'Vehicle not found in any registry' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
