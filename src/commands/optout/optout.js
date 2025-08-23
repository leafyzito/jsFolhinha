const optoutCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato ${message.prefix}optout <lastseen/stalk/remind>`,
    };
  }

  const optoutTarget = message.args[1]?.toLowerCase();

  if (
    !["channel", "canal", "lastseen", "ls", "stalk", "remind"].includes(
      optoutTarget
    )
  ) {
    return {
      reply: `Use o formato ${message.prefix}optout <lastseen/stalk/remind>`,
    };
  }

  if (["channel", "canal"].includes(optoutTarget)) {
    if (!message.isStreamer) {
      return {
        reply: `Apenas o streamer pode usar este comando`,
      };
    }

    const channelOptout = await fb.db.get("users", {
      userid: message.channelID,
    });
    if (!channelOptout) {
      return {
        reply: `Usuário não encontrado na base de dados`,
      };
    }

    const currState = channelOptout.optoutOwnChannel;

    await fb.db.update(
      "users",
      { userid: message.channelID },
      { $set: { optoutOwnChannel: !currState } }
    );

    return {
      reply: `A partir de agora o canal ${
        currState ? "NÃO" : ""
      } será censurado em comandos stalk`,
    };
  }

  if (["lastseen", "ls"].includes(optoutTarget)) {
    const userOptout = await fb.db.get("users", {
      userid: message.senderUserID,
    });
    if (!userOptout) {
      return {
        reply: `Usuário não encontrado na base de dados`,
      };
    }

    const currState = userOptout.optoutLs;

    await fb.db.update(
      "users",
      { userid: message.senderUserID },
      { $set: { optoutLs: !currState } }
    );

    return {
      reply: `A partir de agora você ${
        !currState ? "NÃO" : ""
      } pode ser alvo de comandos lastseen`,
    };
  }

  if (["stalk"].includes(optoutTarget)) {
    const userOptout = await fb.db.get("users", {
      userid: message.senderUserID,
    });
    if (!userOptout) {
      return {
        reply: `Usuário não encontrado na base de dados`,
      };
    }

    const currState = userOptout.optoutStalk;

    await fb.db.update(
      "users",
      { userid: message.senderUserID },
      { $set: { optoutStalk: !currState } }
    );

    return {
      reply: `A partir de agora você ${
        !currState ? "NÃO" : ""
      } pode ser alvo de comandos stalk`,
    };
  }

  if (["remind"].includes(optoutTarget)) {
    const userOptout = await fb.db.get("users", {
      userid: message.senderUserID,
    });
    if (!userOptout) {
      return {
        reply: `Usuário não encontrado na base de dados`,
      };
    }

    const currState = userOptout.optoutRemind;

    await fb.db.update(
      "users",
      { userid: message.senderUserID },
      { $set: { optoutRemind: !currState } }
    );

    return {
      reply: `A partir de agora você ${
        !currState ? "NÃO" : ""
      } pode ser alvo de comandos remind`,
    };
  }
};

optoutCommand.commandName = "optout";
optoutCommand.aliases = ["optout"];
optoutCommand.shortDescription = "Opte fora de alguns comandos do bot";
optoutCommand.cooldown = 5000;
optoutCommand.cooldownType = "channel";
optoutCommand.whisperable = false;
optoutCommand.description = `Alterne entre o estado ativado e desativado de ser alvo de alguns comandos do bot

!optout stalk - Alterne o estado da possibilidade de ser alvo de comandos stalk
!optout lastseen - Alterne o estado da possibilidade de ser alvo de comandos lastseen
!optout remind - Alterne o estado da possibilidade de ser alvo de comandos remind
!optout channel - Alterne o estado da censura do nome do seu canal no uso de comandos stalk`;
optoutCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  optoutCommand,
};
