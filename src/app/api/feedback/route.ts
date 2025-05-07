import { NextRequest, NextResponse } from 'next/server';
import { storeFeedbackAnalytics } from '@/services/analytics-db';

// Simple in-memory rate limiting (for demo; use Redis or DB for production)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max 10 requests per IP per window
const ipTimestamps: Record<string, number[]> = {};

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const now = Date.now();
  ipTimestamps[ip] = (ipTimestamps[ip] || []).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (ipTimestamps[ip].length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
  }
  ipTimestamps[ip].push(now);

  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Basic validation
  if (!data || typeof data !== 'object' || !('type' in data) || !('payload' in data)) {
    return NextResponse.json({ error: 'Invalid feedback format' }, { status: 400 });
  }

  // TODO: Store feedback/analytics securely (e.g., database, external service)
  // For now, just log to server
  storeFeedbackAnalytics({
    ip,
    feedbackType: data.type,
    payload: data.payload,
  });
  console.log('Feedback/Analytics received:', data);

  return NextResponse.json({ success: true });
}