const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Chatbot Application...');

// Set environment variables
process.env.ASPNETCORE_ENVIRONMENT = 'Development';
process.env.ASPNETCORE_URLS = 'http://localhost:5001';

// Start backend
console.log('Starting .NET Backend...');
const backend = spawn('dotnet', ['run', '--project', 'Backend/ChatbotApp.Backend.csproj'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Wait a bit for backend to start
setTimeout(() => {
  // Start frontend
  console.log('Starting Angular Frontend...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'Frontend'),
    stdio: 'inherit',
    shell: true
  });

  // Wait for frontend to start then open browser
  setTimeout(() => {
    console.log('Opening browser...');
    const { exec } = require('child_process');
    exec('start http://localhost:4200', (error) => {
      if (error) {
        console.log('Could not open browser automatically. Please navigate to http://localhost:4200');
      }
    });
  }, 10000);

  frontend.on('close', (code) => {
    console.log(`Frontend exited with code ${code}`);
    backend.kill();
  });

}, 3000);

backend.on('close', (code) => {
  console.log(`Backend exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('Shutting down...');
  backend.kill();
  process.exit();
});
