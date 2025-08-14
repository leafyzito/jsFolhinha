async function updateDiscordPresence() {
  const joinedChannels = [...fb.twitch.anonClient.joinedChannels];
  const channelsToJoin = [...fb.twitch.anonClient.channelsToJoin];
  fb.discord.client.user.setActivity({
    type: 4,
    name: "Folhinha Uptime",
    state: `Up: ${fb.utils.relativeTime(fb.startTime, true)} - ${
      joinedChannels.length
    }/${channelsToJoin.length}`,
  });
}

module.exports = updateDiscordPresence;
