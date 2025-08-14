const petAttentionTask = require("./petAttention");
const fetchPendingJoins = require("./fetchPendingJoins");
const rejoinDisconnectedChannels = require("./rejoinDisconnectedChannels");
const updateDiscordPresence = require("./updateDiscordPresence");

function startPetTask() {
  setInterval(() => petAttentionTask(), 60_000);
}

function startFetchPendingJoinsTask() {
  setInterval(() => fetchPendingJoins(), 10_000);
}

function startRejoinDisconnectedChannelsTask() {
  setInterval(() => rejoinDisconnectedChannels(), 30_000);
}

function startDiscordPresenceTask() {
  setInterval(() => updateDiscordPresence(), 60_000);
}

module.exports = {
  startPetTask,
  startFetchPendingJoinsTask,
  startRejoinDisconnectedChannelsTask,
  startDiscordPresenceTask,
};
