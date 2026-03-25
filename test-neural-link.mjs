import { POST } from './src/app/api/chat/route.ts';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock Request object for Next.js app route
class MockRequest {
  constructor(body) {
    this.bodyData = body;
  }
  async json() {
    return this.bodyData;
  }
}

async function testMain() {
  console.log('🚀 TESTING NEURAL LINK...');
  
  const mockReq = new MockRequest({
    messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
    userId: 'guest-explorer',
    personaId: 'kaelani-x'
  });

  try {
    const response = await POST(mockReq);
    console.log('📡 Stream Received. Status:', response.status);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      process.stdout.write(chunk);
    }
    console.log('\n✅ Test Finished Successfully.');
  } catch (e) {
    console.error('❌ Test Failed:', e.message);
  }
}

testMain();

