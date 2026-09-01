import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';

export async function GET(){return NextResponse.json({credits:db.getCredits()});}
