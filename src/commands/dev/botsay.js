const botSayCommand = async (message) => {
  const args = message.messageText.split(" ");
  const targetChannel = args[1];
  const msgContent = args.slice(2).join(" ");

  if (targetChannel == "all") {
    for (let i = 0; i < [...fb.joinedChannels].length; i++) {
      const channel = [...fb.joinedChannels][i];
      await new Promise((resolve) => setTimeout(resolve, 2_500)); // 2.5 second interval between each message

      // console.log(`sending to ${channel}`);
      fb.log.send(channel, msgContent);
    }
    return {
      reply: `foi`,
      notes: `Sent message to all channels`,
    };
  }

  fb.log.send(targetChannel, msgContent);
  return {
    reply: `foi`,
    notes: `Sent message to ${targetChannel}`,
  };
};

// Command metadata
botSayCommand.commandName = "botsay";
botSayCommand.aliases = ["botsay", "bsay"];
botSayCommand.shortDescription = "Make the bot say something in a channel";
botSayCommand.cooldown = 5_000;
botSayCommand.cooldownType = "user";
botSayCommand.permissions = ["admin"];
botSayCommand.whisperable = false;
botSayCommand.flags = ["dev"];

module.exports = { botSayCommand };
