const { exec } = require('child_process');

exec('npm start', (err, stdout, stderr) => {
    if (err) {
        console.error(`Error restarting the app: ${err}`);
        return;
    }
    console.log(stdout);
    console.error(stderr);
});

process.exit();