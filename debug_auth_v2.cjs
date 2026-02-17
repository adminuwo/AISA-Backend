const { GoogleAuth, Impersonated } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const os = require('os');
const fs = require('fs');

const TARGET_SERVICE_ACCOUNT = 'video-signer@ai-mall-484810.iam.gserviceaccount.com';

async function testAuth() {
    console.log("--- Starting Auth Debug ---");

    // 1. Check Environment
    const homeDir = os.homedir();
    console.log(`Home Dir: ${homeDir}`);

    const localAdcPath = path.join(homeDir, 'AppData', 'Roaming', 'gcloud', 'application_default_credentials.json');
    console.log(`Constructed ADC Path: ${localAdcPath}`);

    const fileExists = fs.existsSync(localAdcPath);
    console.log(`ADC File Exists: ${fileExists}`);

    console.log(`Env Var GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

    // 2. Initialize Auth
    let authOptions = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        projectId: process.env.GCP_PROJECT_ID || 'ai-mall-484810',
    };

    if (fileExists) {
        console.log("ADC file found, explicitly setting keyFilename...");
        authOptions.keyFilename = localAdcPath;
    } else {
        console.log("ADC file NOT found, relying on default discovery...");
    }

    try {
        console.log("Creating GoogleAuth...");
        const auth = new GoogleAuth(authOptions);

        console.log("Getting Source Client...");
        const sourceClient = await auth.getClient();
        const projectId = await auth.getProjectId();
        console.log(`Source Client obtained. Project ID: ${projectId}`);

        // 3. Impersonation
        console.log(`Attempting impersonation of: ${TARGET_SERVICE_ACCOUNT}`);
        const impersonatedClient = new Impersonated({
            sourceClient,
            targetPrincipal: TARGET_SERVICE_ACCOUNT,
            lifetime: 3600,
            targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const storage = new Storage({
            authClient: impersonatedClient,
            projectId: projectId
        });

        // 4. Test Signing
        console.log("Testing URL signing...");
        const [url] = await storage
            .bucket('aisageneratedvideo')
            .file('test.mp4')
            .getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000,
                responseType: 'video/mp4',
                serviceAccountEmail: TARGET_SERVICE_ACCOUNT,
            });

        console.log("SUCCESS! Signed URL generated:");
        console.log(url);

    } catch (error) {
        console.error("--- ERROR ---");
        console.error(error);
        if (error.stack) console.error(error.stack);
    }
}

testAuth();
