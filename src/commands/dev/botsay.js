const botSayCommand = async (message) => {
  const args = message.messageText.split(" ");
  const targetChannel = args[1];
  const msgContent = args.slice(2).join(" ");

  if (targetChannel == "all") {
    for (let i = 0; i < [...fb.joinedChannels].length; i++) {
      const channel = [...fb.joinedChannels][i];
      await new Promise((resolve) => setTimeout(resolve, 5_000)); // 5 second interval between each message

      // console.log(`sending to ${channel}`);
      fb.log.send(channel, msgContent);
    }
    return {
      reply: `foi`,
    };
  }

  fb.log.send(targetChannel, msgContent);
  return {
    reply: `foi`,
  };
};

// Command metadata
botSayCommand.commandName = "botsay";
botSayCommand.aliases = ["botsay", "bsay"];
botSayCommand.shortDescription =
  "[DEV] Faz o bot enviar uma mensagem em um canal";
botSayCommand.cooldown = 5_000;
botSayCommand.cooldownType = "user";
botSayCommand.permissions = ["admin"];
botSayCommand.whisperable = false;
botSayCommand.flags = ["dev"];
botSayCommand.description = `Envie uma mensagem personalizada como o bot em um canal específico ou em todos os canais onde o bot está presente

• Exemplo: !botsay canalexemplo Olá - O bot envia "Olá" no canal "canalexemplo"
• Exemplo: !botsay all Mensagem global - O bot envia "Mensagem global" em todos os canais onde está presente`;

module.exports = { botSayCommand };
