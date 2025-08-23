const { commandsList } = require("../../commands/commandsList");

function getCommandObjectByAlias(alias) {
  return (
    Object.values(commandsList)
      .flatMap((command) => [command, ...command.aliases])
      .find(
        (item) => item.aliases?.includes(alias) || item.commandName === alias
      ) || null
  );
}

const configCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Se estiver com dúvidas sobre o comando config, acesse https://folhinhabot.com/comandos/config 😁`,
    };
  }

  const configTarget = message.args[1].toLowerCase();

  // MARKER: prefix
  if (["prefixo", "prefix"].includes(configTarget)) {
    if (message.args.length < 3) {
      return {
        reply: `Use o formato: ${
          message.prefix
        }config prefixo <prefixo>. Prefixos disponíveis: ${fb.utils
          .validPrefixes()
          .join("")}`,
      };
    }
    const chosenPrefix = message.args[2];

    if (!fb.utils.validPrefixes().includes(chosenPrefix)) {
      return {
        reply: `Prefixo inválido. Prefixos disponíveis: ${fb.utils
          .validPrefixes()
          .join("")}`,
      };
    }

    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $set: { prefix: chosenPrefix } }
    );

    return {
      reply: `Prefixo atualizado para ${chosenPrefix}`,
    };
  }

  // MARKER: ban
  if (configTarget === "ban") {
    if (message.args.length < 3) {
      return {
        reply: `Use o formato: ${message.prefix}config ban <comando para banir>`,
      };
    }

    const chosenCommand = message.args[2].toLowerCase();
    const command = getCommandObjectByAlias(chosenCommand);

    if (!command) {
      return {
        reply: `O comando ${chosenCommand} não é válido. Se estiver com dúvidas, contacte o @${process.env.DEV_NICK}`,
      };
    }

    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $push: { disabledCommands: command.commandName } }
    );

    return {
      reply: `O comando ${command.commandName} foi desativado`,
    };
  }

  // MARKER: unban
  if (configTarget === "unban") {
    if (message.args.length < 3) {
      return {
        reply: `Use o formato: ${message.prefix}config unban <comando para reabilitar>`,
      };
    }

    const chosenCommand = message.args[2].toLowerCase();
    const command = getCommandObjectByAlias(chosenCommand);

    if (!command) {
      return {
        reply: `O comando ${chosenCommand} não é válido. Se estiver com dúvidas, contacte o @${process.env.DEV_NICK}`,
      };
    }

    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $pull: { disabledCommands: command.commandName } }
    );

    return {
      reply: `O comando ${command.commandName} foi reabilitado`,
    };
  }

  // MARKER: offline
  if (["offline", "online"].includes(configTarget)) {
    const currState = (
      await fb.db.get("config", {
        channelId: message.channelID,
      })
    ).offlineOnly;
    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $set: { offlineOnly: !currState } }
    );

    if (!currState) {
      return {
        reply: `Eu agora só vou funcionar quando o streamer não estiver em live 👍`,
      };
    } else {
      return {
        reply: `Eu agora vou funcionar independentemente de o streamer estar em live ou não 👍`,
      };
    }
  }
};

configCommand.commandName = "config";
configCommand.aliases = ["config"];
configCommand.shortDescription = "Mude as configurações do bot para o seu chat";
configCommand.cooldown = 1000;
configCommand.cooldownType = "channel";
configCommand.permissions = ["mod", "admin"];
configCommand.flags = ["always"];
configCommand.whisperable = false;
configCommand.description = `Mude algumas confugurações do bot para o chat atual
Caso queira trocar o prefixo do bot, pode usar o comando !config prefixo {prefixo}, sendo a lista de prefixos válidos:
?&%+*-=|@#$~\\_,;<>
• Exemplo: !config prefixo ? - Muda o prefixo do bot para "?"

Caso deseje desativar algum comando no chat, pode usar !config ban {comando} ou !config unban {comando} para reabilitá-lo
• Exemplo: !config ban piada - Desativa o comando "piada" no canal
• Exemplo: !config unban piada - Reabilita o comando "piada" no canal

Caso queira que o bot apenas funcione quando o canal estiver offline, pode usar o comando !config offline
Usar o comando !config offline alterna entre o estado ativado e desativado. Por padrão, esta função está desativada

Este comandos podem ser executados apenas pelo streamer ou os moderadores do canal`;
configCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  configCommand,
};
