
async function testGenerate() {
  try {
    console.log('Testing /api/recipe/generate...');
    const response = await fetch('http://localhost:3000/api/recipe/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ingredients: ['牛油果', '鸡蛋'],
        preferences: ''
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGenerate();
