module.exports = function onJoin(channel) {
  console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
};
