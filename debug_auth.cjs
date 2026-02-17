const { GoogleAuth, Impersonated } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');

const TARGET_SERVICE_ACCOUNT = 'video-signer@ai-mall-484810.iam.gserviceaccount.com';

async function createImpersonatedStorageClient() {
    console.log("Initializing GoogleAuth (CJS)...");
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    console.log("Getting Client...");
    try {
        const sourceClient = await auth.getClient();
        console.log("Got Client. Project ID:", await auth.getProjectId());

        const impersonatedClient = new Impersonated({
            sourceClient,
            targetPrincipal: TARGET_SERVICE_ACCOUNT,
            lifetime: 3600,
            targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        return new Storage({
            authClient: impersonatedClient,
        });
    } catch (e) {
        console.error("Auth Error:", e);
        throw e;
    }
}

async function run() {
    try {
        const storage = await createImpersonatedStorageClient();
        console.log("Storage client created. Testing signing...");

        const [url] = await storage
            .bucket('aisageneratedvideo')
            .file('test.mp4')
            .getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000,
                responseType: 'video/mp4',
            });

        console.log("Signed URL:", url);
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

run();
