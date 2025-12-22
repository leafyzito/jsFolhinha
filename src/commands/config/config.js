const path = require("path");
function getCommandObjectByAlias(alias) {
  return (
    Object.values(fb.commandsList)
      .flatMap((command) => [command, ...command.aliases])
      .find(
        (item) => item.aliases?.includes(alias) || item.commandName === alias
      ) || null
  );
}

const configCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Acesse https://folhinhabot.com/dashboard para uma forma mais fácil e intuitiva de mudar as configurações do bot`,
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

  // MARKER: emote streak
  if (["emotestreak", "emote"].includes(configTarget)) {
    const currState = (
      await fb.db.get("config", {
        channelId: message.channelID,
      })
    ).emoteStreak;
    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $set: { emoteStreak: !currState } }
    );

    if (!currState) {
      return {
        reply: `Eu agora vou anunciar quando uma streak de emotes acontecer ✅`,
      };
    } else {
      return {
        reply: `Eu agora NÃO vou anunciar quando uma streak de emotes acontecer ❌`,
      };
    }
  }

  // MARKER: thank follows
  if (["thankfollows", "thankfollow"].includes(configTarget)) {
    // Check if a custom message was provided
    if (message.args.length >= 3) {
      const customMessage = message.args.slice(2).join(" ").trim();
      await fb.db.update(
        "config",
        { channelId: message.channelID },
        {
          $set: {
            "customMessages.follow": customMessage,
          },
        }
      );
      return {
        reply: `Mensagem customizada para follows atualizada: "${customMessage}" ✅`,
      };
    } else {
      // Toggle the boolean
      const currState = (
        await fb.db.get("config", {
          channelId: message.channelID,
        })
      ).thankFollows;
      await fb.db.update(
        "config",
        { channelId: message.channelID },
        { $set: { thankFollows: !currState } }
      );

      if (!currState) {
        return {
          reply: `Eu agora vou agradecer quando alguém seguir o canal ✅`,
        };
      } else {
        return {
          reply: `Eu agora NÃO vou agradecer quando alguém seguir o canal ❌`,
        };
      }
    }
  }

  // MARKER: thank subs
  if (["thanksubs", "thanksub"].includes(configTarget)) {
    // Check if a custom message was provided
    if (message.args.length >= 3) {
      const customMessage = message.args.slice(2).join(" ").trim();
      await fb.db.update(
        "config",
        { channelId: message.channelID },
        {
          $set: {
            "customMessages.newSub": customMessage,
            "customMessages.resub": customMessage,
            "customMessages.giftSub": customMessage,
          },
        }
      );
      return {
        reply: `Mensagem customizada para subs atualizada: "${customMessage}" ✅`,
      };
    } else {
      // Toggle the boolean
      const currState = (
        await fb.db.get("config", {
          channelId: message.channelID,
        })
      ).thankSubs;
      await fb.db.update(
        "config",
        { channelId: message.channelID },
        { $set: { thankSubs: !currState } }
      );

      if (!currState) {
        return {
          reply: `Eu agora vou agradecer quando alguém se inscrever no canal ✅`,
        };
      } else {
        return {
          reply: `Eu agora NÃO vou agradecer quando alguém se inscrever no canal ❌`,
        };
      }
    }
  }

  return {
    reply: `Acesse https://folhinhabot.com/dashboard para uma forma mais fácil e intuitiva de mudar as configurações do bot`,
  };
};

configCommand.commandName = "config";
configCommand.aliases = ["config"];
configCommand.shortDescription = "Mude as configurações do bot para o seu chat";
configCommand.cooldown = 1000;
configCommand.cooldownType = "channel";
configCommand.permissions = ["mod", "admin"];
configCommand.flags = ["always"];
configCommand.whisperable = false;
configCommand.description = `Mude algumas configurações do bot para o chat atual
Para uma forma mais intuitiva de mudar as configurações do bot, veja o Dashboard no site

Caso queira trocar o prefixo do bot, pode usar o comando !config prefixo {prefixo}, sendo a lista de prefixos válidos:
?&%+*-=|@#$~\\_,;<>
• Exemplo: !config prefixo ? - Muda o prefixo do bot para "?"

Caso deseje desativar algum comando no chat, pode usar !config ban {comando} ou !config unban {comando} para reabilitá-lo
• Exemplo: !config ban piada - Desativa o comando "piada" no canal
• Exemplo: !config unban piada - Reabilita o comando "piada" no canal

Caso queira que o bot apenas funcione quando o canal estiver offline, pode usar o comando !config offline
Usar o comando !config offline alterna entre o estado ativado e desativado. Por padrão, esta função está desativada

Se quiser que o bot anuncie quando houver um streak de emotes, use o comando !config emotestreak
Usar o comando !config emotestreak alterna entre o estado ativado e desativado. Por padrão, esta função está desativada

Se quiser que o bot agradeça quando alguém seguir o canal, use o comando !config thankfollows
Usar o comando !config thankfollows alterna entre o estado ativado e desativado. Por padrão, esta função está desativada
Você pode definir uma mensagem customizada usando: !config thankfollows mensagem_personalizada_aqui
Placeholders disponíveis: {user}, {emote}

Se quiser que o bot agradeça quando alguém se inscrever no canal, use o comando !config thanksubs
Usar o comando !config thanksubs alterna entre o estado ativado e desativado. Por padrão, esta função está desativada
Você pode definir uma mensagem customizada usando: !config thanksubs mensagem_personalizada_aqui
Placeholders disponíveis: {user}, {gifter}, {months}, {amount}, {emote}

Este comandos podem ser executados apenas pelo streamer ou os moderadores do canal`;
configCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  configCommand,
};
