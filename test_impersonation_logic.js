import 'dotenv/config';
import { GoogleAuth, Impersonated } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';

async function testImpersonation() {
    try {
        console.log('Starting impersonation test...');
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const targetPrincipal = 'sanskar@uwo24.com';

        console.log('Source client created. Creating impersonated client...');

        const authClient = new Impersonated({
            sourceClient: client,
            targetPrincipal: targetPrincipal,
            lifetime: 3600,
            delegates: [],
            targetScopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        console.log('Impersonated client created.');

        const storage = new Storage({
            projectId: 'ai-mall-484810',
            authClient: authClient
        });

        console.log('Storage client created with impersonated auth.');

        // Just try to list buckets or get a bucket reference to see if auth fails immediately
        // Or try to sign a dummy URL if allowed
        const bucketName = 'aisageneratedvideo';
        const fileName = 'test_dummy.mp4';
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        console.log('Attempting to sign URL...');
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        });

        console.log('Success! Signed URL:', url);

    } catch (error) {
        console.error('Error during impersonation test:', error);
    }
}

testImpersonation();
