import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Placeholder for email or database logic
    console.log('Contact form submission:', body);

    return NextResponse.json({ 
      success: true, 
      message: 'Message received. Welcome to the Inner Circle.' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process request.' 
    }, { status: 400 });
  }
}



