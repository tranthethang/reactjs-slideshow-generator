#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

const PORT = process.argv[2] || 3000;

function killPort(port) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      // Windows command
      command = `netstat -ano | findstr :${port} | for /f "tokens=5" %a in ('more') do taskkill /F /PID %a`;
    } else {
      // Unix/Linux/macOS command
      command = `lsof -ti:${port} | xargs kill -9`;
    }

    console.log(`🔍 Checking for processes on port ${port}...`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 1) {
          console.log(`✅ No processes found running on port ${port}`);
        } else {
          console.log(`⚠️  Error checking port ${port}:`, error.message);
        }
        resolve();
      } else {
        console.log(`✅ Successfully killed processes on port ${port}`);
        resolve();
      }
    });
  });
}

async function main() {
  try {
    await killPort(PORT);
    console.log(`🚀 Port ${PORT} is now available`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { killPort };