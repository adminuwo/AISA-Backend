import axios from 'axios';
async function test() {
  try {
    const res = await axios.post('http://localhost:8080/api/auth/login', {email: 'gauharifetkhar@gmail.com', password: 'Password@123'});
    const token = res.data.token;
    console.log('Logged in');
    const editRes = await axios.post('http://localhost:8080/api/image/edit', {prompt: 'remove background', imageUrl: 'https://picsum.photos/200/300'}, {headers: {Authorization: 'Bearer ' + token}});
    console.log(editRes.data);
  } catch(err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
