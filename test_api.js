import axios from 'axios';
async function test() {
  try {
    const signupRes = await axios.post('http://localhost:8080/api/auth/signup', {
      name: 'TestUser123',
      email: 'test_user_' + Date.now() + '@abc.com',
      password: 'Password@123'
    });
    console.log('Signup success. Token received.');
    const token = signupRes.data.token;
    
    console.log('Testing image edit endpoint...');
    const editRes = await axios.post('http://localhost:8080/api/image/edit', {
      prompt: 'remove background',
      imageUrl: 'https://picsum.photos/200/300'
    }, {
      headers: { Authorization: 'Bearer ' + token }
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
