import axios from 'axios';
import crypto from 'crypto';

async function test() {
  try {
    const signupRes = await axios.post('http://localhost:8080/api/auth/signup', {
      name: 'TestUserB',
      email: 'test_user_b_' + Date.now() + '@abc.com',
      password: 'Password@123'
    });
    const token = signupRes.data.token;
    
    console.log('Testing image edit with BASE64...');
    // create a 1MB base64 string to simulate a large image
    const largeB64 = 'data:image/jpeg;base64,' + crypto.randomBytes(1024 * 1024).toString('base64');
    
    const editRes = await axios.post('http://localhost:8080/api/image/edit', {
      prompt: 'remove background',
      imageUrl: largeB64
    }, {
      headers: { Authorization: 'Bearer ' + token },
      maxBodyLength: Infinity
    });
    console.log('Edit Response:', editRes.data);
  } catch(e) {
    if (e.response) {
      console.error('API Error:', e.response.status, e.response.data);
    } else {
      console.error('Error:', e.message);
    }
  }
}
test();
