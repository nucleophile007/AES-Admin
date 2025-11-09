const { execSync } = require('child_process');

console.log('Starting Next.js development server...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting server:', error);
}