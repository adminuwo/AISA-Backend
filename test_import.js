
try {
    await import('./controllers/videoController.js');
    console.log('Successfully imported videoController.js');
} catch (error) {
    console.error('Failed to import videoController.js:', error);
}
