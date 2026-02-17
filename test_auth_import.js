import * as pkg from 'google-auth-library';
console.log('Keys:', Object.keys(pkg));
try {
    import { ImpersonatedCredentials } from 'google-auth-library';
    console.log('Named import success');
} catch (e) {
    console.log('Named import failed:', e.message);
}
