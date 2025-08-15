const { exec } = require("child_process");

let counterToRestart = 0;

async function rejoinDisconnectedChannels() {
  const channelsToJoin = [...new Set([...fb.twitch.anonClient.channelsToJoin])];
  if (!channelsToJoin || channelsToJoin.length === 0) {
    return;
  }
  const rejoinedChannels = [];

  channelsToJoin.forEach(async (channel) => {
    if (![...fb.twitch.anonClient.joinedChannels].includes(channel)) {
      console.log(`* Rejoining ${channel}`);
      rejoinedChannels.push(channel);
      fb.twitch.anonClient.join(channel);
    }
  });

  if (rejoinedChannels.length > 0) {
    if (rejoinedChannels.length == channelsToJoin.length) {
      counterToRestart++;
      if (counterToRestart >= 4) {
        console.log(`* Restarting client`);
        fb.discord.log(`* Restarting client`);

        exec(
          "docker compose restart",
          { cwd: process.cwd() },
          (err, stdout, stderr) => {
            if (err) {
              console.log(`* Erro ao reiniciar compose: ${err}`);
              fb.discord.log(`* Erro ao reiniciar compose: ${err}`);
              return;
            }

            if (stderr) {
              console.log(`* Docker stderr: ${stderr}`);
            }

            console.log(`* Compose reiniciado: ${stdout}`);
            fb.discord.log(`* Compose reiniciado: ${stdout}`);
          }
        );
      }
    }
    console.log(`* Rejoining ${rejoinedChannels.length} channels`);
    fb.discord.log(`* Rejoining ${rejoinedChannels.length} channels`);
  }
}

module.exports = rejoinDisconnectedChannels;
