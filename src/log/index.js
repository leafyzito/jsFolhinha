class Logger {
  constructor() {
    this.channelMsgCooldowns = new Map(); // Track last message timestamp per channel
  }

  async manageChannelMsgCooldown(channel) {
    // universal cooldown for all channels to avoid timeouts
    const now = Date.now();
    const lastMessageTime = this.channelMsgCooldowns.get(channel) || 0;
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < 2000) {
      // 2 seconds cooldown
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 - timeSinceLastMessage)
      );
    }

    this.channelMsgCooldowns.set(channel, Date.now());
  }

  // handle send errors
  handleSendError(
    err,
    channel,
    content,
    retryMethod,
    retryCount = 0,
    lastResortWhisperTarger = null
  ) {
    // console.log('handleSendError: ', err);

    // Handle identical message error - no retries needed
    if (err.cause.message.includes("identical to the previous one")) {
      console.log("sending identical message error, ending here");
      return;
    }

    // Check if we've hit max retries
    if (retryCount >= 3) {
      // send whisper to user as last resort
      if (lastResortWhisperTarger) {
        console.log("Max retries reached, whispering response to user");
        fb.discord.log(
          `* Dropped message in #${channel}, whispering response to ${lastResortWhisperTarger}: ${content}`
        );
        fb.api.helix.whisper(lastResortWhisperTarger, content);
        return;
      }
      console.log("Max retries reached, dropping message");
      fb.discord.log(`* Dropped message in #${channel}: ${content}`);
      return;
    }

    // Handle retryable errors
    const isRetryableError =
      err.cause.message.includes("too quickly") ||
      err.cause.message.includes("waiting for response");
    const errorType = err.cause.message.includes("too quickly")
      ? "sending messages too quickly"
      : "waiting for response";

    if (isRetryableError) {
      console.log(`${errorType} error, retrying (${retryCount + 1}/3)`);
      setTimeout(() => {
        retryMethod(channel, content, retryCount + 1, lastResortWhisperTarger);
      }, 1500);
      return;
    }

    // Handle any other errors
    console.log("send error: ", err);
  }

  async createCommandLog(message, response) {
    const insertDoc = {
      messageid: message.messageID,
      sentDate: message.serverTimestamp,
      channel: message.channelName,
      channelId: message.channelID || null,
      user: message.senderUsername,
      userId: message.senderUserID,
      command: message.command,
      content: message.messageText,
      response: response,
      notes: message.notes || null,
    };

    fb.discord.logCommand(message, response);
    if (!message.command.includes("dev") && process.env.ENV == "prod") {
      await fb.db.insert("commandlog", insertDoc);
    }
  }

  async logAndReply(message, response, retryCount = 0) {
    response = fb.utils.checkRegex(response, message.channelName, message);

    if (message.channelName == "whisper") {
      fb.api.helix.whisper(message.senderUsername, response);
    } else {
      await this.manageChannelMsgCooldown(message.channelName);
      fb.twitch.client
        .reply(message.channelName, message.messageID, response)
        .catch((err) =>
          this.handleSendError(
            err,
            message.channelName,
            response,
            (channel, content, retryCount, senderUsername) =>
              this.send(channel, content, retryCount, senderUsername),
            retryCount,
            message.senderUsername
          )
        );
    }

    await this.createCommandLog(message, response);
    console.log(
      `#${message.channelName}/${message.senderUsername} - ${message.command}`
    );
  }

  async logAndSay(message, response, notes = null, retryCount = 0) {
    message.notes = notes;
    response = fb.utils.checkRegex(response, message.channelName, message);

    await this.manageChannelMsgCooldown(message.channelName);
    fb.twitch.client
      .say(message.channelName, response)
      .catch((err) =>
        this.handleSendError(
          err,
          message.channelName,
          response,
          (channel, content, retryCount, senderUsername) =>
            this.send(channel, content, retryCount, senderUsername),
          retryCount,
          message.senderUsername
        )
      );

    await this.createCommandLog(message, response);
    console.log(
      `#${message.channelName}/${message.senderUsername} - ${message.command}`
    );
  }

  async logAndMeAction(message, response, retryCount = 0) {
    response = fb.utils.checkRegex(response, message.channelName, message);

    await this.manageChannelMsgCooldown(message.channelName);
    fb.twitch.client
      .me(message.channelName, response)
      .catch((err) =>
        this.handleSendError(
          err,
          message.channelName,
          response,
          (channel, content, retryCount, senderUsername) =>
            this.send(channel, content, retryCount, senderUsername),
          retryCount,
          message.senderUsername
        )
      );

    await this.createCommandLog(message, "/me " + response);
    console.log(
      `#${message.channelName}/${message.senderUsername} - ${message.command}`
    );
  }

  async logAndWhisper(message, response, notes = null) {
    message.notes = notes;
    response = fb.utils.checkRegex(response, message.senderUsername, message);

    fb.api.helix.whisper(message.senderUsername, response);
    fb.discord.logWhisper(message.senderUsername, response);
  }

  async send(channel, content, retryCount = 0, senderUsername = null) {
    content = fb.utils.checkRegex(content, channel);

    await this.manageChannelMsgCooldown(channel);
    fb.twitch.client
      .say(channel, content)
      .catch((err) =>
        this.handleSendError(
          err,
          channel,
          content,
          (channel, content, retryCount, senderUsername) =>
            this.send(channel, content, retryCount, senderUsername),
          retryCount,
          senderUsername
        )
      );

    fb.discord.logSend(channel, content);
  }

  async reply(message, response, retryCount = 0) {
    response = fb.utils.checkRegex(response, message.channelName, message);

    await this.manageChannelMsgCooldown(message.channelName);
    fb.twitch.client
      .reply(message.channelName, message.messageID, response)
      .catch((err) =>
        this.handleSendError(
          err,
          message.channelName,
          response,
          (channel, content, retryCount, senderUsername) =>
            this.send(channel, content, retryCount, senderUsername),
          retryCount,
          message.senderUsername
        )
      );

    fb.discord.logSend(message.channelName, response);
  }

  async whisper(targetUser, content, retryCount = 0) {
    content = fb.utils.checkRegex(content, targetUser);

    fb.api.helix
      .whisper(targetUser, content)
      .catch((err) =>
        this.handleSendError(
          err,
          targetUser,
          content,
          this.whisper.bind(this),
          retryCount,
          null
        )
      );

    fb.discord.logWhisper(targetUser, content);
  }
}

module.exports = Logger;
