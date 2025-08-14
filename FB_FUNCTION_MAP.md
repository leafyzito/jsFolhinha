# FB Object Function List

This document lists all functions available in the global `fb` object for reference.

```javascript
// API FUNCTIONS
// HELIX
fb.api.helix.getUserByUsername(username);
fb.api.helix.getUserByID(userId);
fb.api.helix.getManyUsersByUserIDs(userIds);
fb.api.helix.getColor(userId);
fb.api.helix.getStream(username);
fb.api.helix.isStreamOnline(channelName);
fb.api.helix.timeoutUser(channelId, userId, duration, reason);
fb.api.helix.whisper(whisperTargetId, content);

// GITHUB
fb.api.github.createGist(content);

// RUSTLOG
fb.api.rustlog.addChannel(channelId);
fb.api.rustlog.removeChannel(channelId);

// 7TV
fb.api.stv.updatePresence(uid, channelID);

// CHUW
fb.api.chuw.shortenUrl(url);

// IVR
fb.api.ivr.getUser(username);
fb.api.ivr.getLive(username);
fb.api.ivr.getSubAge(user, channel);

// DATABASE FUNCTIONS
fb.db.get(collectionName, query, forceDb);
fb.db.insert(collectionName, data);
fb.db.update(collectionName, query, update);\
fb.db.updateMany(collectionName, query, update);
fb.db.delete(collectionName, query);
fb.db.count(collectionName, query);

// DISCORD FUNCTIONS
fb.discord.log(message);
fb.discord.logCommand(message, response);
fb.discord.logError(error);
fb.discord.logImportant(message);
fb.discord.logSend(channel, content);
fb.discord.logWhisper(username, content);
fb.discord.logWhisperFrom(message);
fb.discord.notifyDevMention(message);

// EMOTE FUNCTIONS
fb.emotes.get7tv(channelId);
fb.emotes.getBttv(channelId);
fb.emotes.getFfz(channelId);
fb.emotes.getEmotes(channelId, channelName);
fb.emotes.getChannelEmotes(channelName);
fb.emotes.getEmoteFromList(channelName, emoteList, defaultResponse);

// LOGGING FUNCTIONS
fb.log.logAndReply(message, response);
fb.log.logAndSay(message, response);
fb.log.logAndMeAction(message, response);
fb.log.logAndWhisper(message, response);

// TWITCH FUNCTIONS
fb.twitch.join(channels);

// UTILITY FUNCTIONS
fb.request(url, options); // = undici request
fb.utils.capitalize(str);
fb.utils.checkRegex(content, channelName, message);
fb.utils.createNewChannelConfig(channelId);
fb.utils.manageLongResponse(content, sendOnlyLink);
fb.utils.randomChoice(arr);
fb.utils.randomInt(min, max);
fb.utils.relativeTime(input, returnOnlyTime, compact);
fb.utils.waitForWhisper(check, timeout);
```
