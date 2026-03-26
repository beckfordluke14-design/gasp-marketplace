const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBirth() {
  const res = await fetch('https://gasp.fun/api/factory/birth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona_id: 'tia-jamaica', category: 'STREET' })
  });
  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log('Result:', data);
}

testBirth();

