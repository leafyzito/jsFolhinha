// check if channel is paused, offline only, or has a disabled command
const shouldSkipMessage = async (channelID, commandName = null) => {
  const channelName = (await fb.api.helix.getUserByID(channelID))?.login;

  const channelData = await fb.db.get("config", {
    channelId: channelID,
  });
  if (!channelData) {
    return false;
  }

  if (channelData.isPaused) {
    return true;
  }

  if (commandName && channelData.disabledCommands.includes(commandName)) {
    return true;
  }

  if (
    channelData.offlineOnly &&
    (await fb.api.helix.isStreamOnline(channelName))
  ) {
    return true;
  }

  return false;
};

module.exports = { shouldSkipMessage };
