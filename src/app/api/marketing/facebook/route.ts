import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GRAPH = 'https://graph.facebook.com/v19.0';

async function uploadPhotoUnpublished(imageUrl: string): Promise<string> {
  const res = await fetch(`${GRAPH}/${process.env.META_PAGE_ID}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      published: false,
      access_token: process.env.META_PAGE_ACCESS_TOKEN,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? 'Photo upload to Facebook failed');
  }
  return data.id; // media_fbid
}

export async function POST(request: Request) {
  try {
    const { vin, copy, photoUrls, platform } = await request.json() as {
      vin: string;
      copy: string;
      photoUrls: string[];
      platform: 'facebook' | 'instagram';
    };

    if (!vin || !copy || !platform) {
      return NextResponse.json(
        { success: false, error: 'vin, copy, and platform are required' },
        { status: 400 }
      );
    }

    let postId: string;

    if (platform === 'instagram') {
      if (!photoUrls?.length) {
        return NextResponse.json(
          { success: false, error: 'Instagram requires at least one photo URL' },
          { status: 400 }
        );
      }

      // Step 1 — create image container
      const containerRes = await fetch(`${GRAPH}/me/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: photoUrls[0],
          caption: copy,
          access_token: process.env.META_PAGE_ACCESS_TOKEN,
        }),
      });
      const container = await containerRes.json();
      if (!containerRes.ok || !container.id) {
        throw new Error(container.error?.message ?? 'Instagram container creation failed');
      }

      // Step 2 — publish
      const publishRes = await fetch(`${GRAPH}/me/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: process.env.META_PAGE_ACCESS_TOKEN,
        }),
      });
      const published = await publishRes.json();
      if (!publishRes.ok || !published.id) {
        throw new Error(published.error?.message ?? 'Instagram publish failed');
      }
      postId = published.id;

    } else {
      // Facebook
      const payload: Record<string, unknown> = {
        message: copy,
        access_token: process.env.META_PAGE_ACCESS_TOKEN,
      };

      if (photoUrls?.length) {
        const mediaFbids = await Promise.all(photoUrls.map(uploadPhotoUnpublished));
        payload.attached_media = mediaFbids.map((id) => ({ media_fbid: id }));
      }

      const feedRes = await fetch(`${GRAPH}/${process.env.META_PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const feedData = await feedRes.json();
      if (!feedRes.ok || !feedData.id) {
        throw new Error(feedData.error?.message ?? 'Facebook feed post failed');
      }
      postId = feedData.id;
    }

    // Record the successful post
    await supabaseAdmin.from('marketing_posts').insert([{
      vin,
      platform,
      copy_text: copy,
      photo_urls: photoUrls ?? [],
      external_post_id: postId,
      status: 'published',
    }]);

    return NextResponse.json({ success: true, postId, platform });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, postId: null, platform: '', error: error.message },
      { status: 500 }
    );
  }
}
