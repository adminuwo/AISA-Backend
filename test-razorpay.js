import Razorpay from 'razorpay';
try {
    console.log('Attempting instantiation...');
    const r = new Razorpay({
        key_id: 'rzp_test_123',
        key_secret: 'secret'
    });
    console.log('Success!', typeof r);
} catch (e) {
    console.error('Failed!', e);
}
