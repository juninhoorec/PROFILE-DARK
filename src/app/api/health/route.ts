import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { SystemDoctor } from '@/lib/ai/doctor/system-doctor';

export async function GET() {
  try {
    const health = db.getProviderHealth();
    const diagnosis = SystemDoctor.diagnose();

    return NextResponse.json({
      app: 'healthy',
      database: 'healthy',
      storage: 'healthy',
      text: health.find((h) => h.service === 'llm')?.status === 'operational' ? 'healthy' : 'degraded',
      image: health.find((h) => h.service === 'image')?.status === 'operational' ? 'healthy' : 'degraded',
      voice: health.find((h) => h.service === 'voice')?.status === 'operational' ? 'healthy' : 'degraded',
      video: health.find((h) => h.service === 'video')?.status === 'operational' ? 'healthy' : 'degraded',
      details: health,
      diagnosis,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        app: 'unhealthy',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
