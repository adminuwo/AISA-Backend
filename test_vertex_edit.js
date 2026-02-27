import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';
import 'dotenv/config';

async function test() {
  const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      projectId: process.env.GCP_PROJECT_ID
  });

  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  const accessTokenResponse = await client.getAccessToken();
  const token = accessTokenResponse.token || accessTokenResponse;
  
  const location = 'us-central1';
  // Testing standard imagegeneration endpoint
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;
  
  // Real valid small base64
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAHBJREFUKFNjZCASMDKgAnv27GEAG0B3GjMg81lYWFgY0FXjVA0zBN0gXJpghuA1DBvAJGq4YTgNAk1G1zAcwM9gmMBwACuTYQPe1TBNYDiA1UowjBg1DAfIMxg2EI0gHCAaQThANABrAOHoANH4AQB1ZSQZzK61VAAAAABJRU5ErkJggg==";

  const payload = {
      instances: [{
          prompt: "remove background",
          image: {
              bytesBase64Encoded: dummyBase64
          }
      }],
      parameters: {
          sampleCount: 1,
          editConfig: {
              editMode: "product-image"
          }
      }
  };

  try {
      const response = await axios.post(
          endpoint,
          payload,
          { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      fs.writeFileSync('vertex_test_out.txt', 'Success @006: ' + Object.keys(response.data));
  } catch (err) {
      fs.writeFileSync('vertex_test_out.txt', 'API Error @006: ' + (err.response?.data?.error?.message || err.message));
  }
}

test();
