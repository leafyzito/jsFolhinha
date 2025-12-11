const getUserIdCommand = async (message) => {
  const targetUser = message.args?.[1];

  if (!targetUser) {
    return {
      reply: `Use o formato correto: ${message.prefix}getuserid <username> ou ${message.prefix}getuserid id <id>`,
    };
  }

  if (targetUser == "id") {
    const targetID = message.args?.[2];
    if (!targetID) {
      return {
        reply: `Use o formato correto: ${message.prefix}getuserid id <id>`,
      };
    }
    const targetUsername = (await fb.api.helix.getUserByID(targetID))?.login;
    return {
      reply: `Username de ${targetID}: ${targetUsername}`,
    };
  }

  const targetUserId = (await fb.api.helix.getUserByUsername(targetUser))?.id;
  return {
    reply: `UserID de ${targetUser}: ${targetUserId}`,
  };
};

// Command metadata
getUserIdCommand.commandName = "getuserid";
getUserIdCommand.aliases = ["getuserid", "uid"];
getUserIdCommand.shortDescription = "[DEV] Obtém o ID de um usuário";
getUserIdCommand.cooldown = 5000;
getUserIdCommand.cooldownType = "user";
getUserIdCommand.permissions = ["admin"];
getUserIdCommand.flags = ["dev"];
getUserIdCommand.whisperable = false;
getUserIdCommand.description = `Permite descobrir o ID de um usuário a partir do nome de usuário, ou obter o nome de usuário a partir do ID

• Exemplo: !getuserid fulano - Mostra o ID do usuário "fulano"
• Exemplo: !getuserid id 123456789 - Mostra o nome de usuário associado ao ID 123456789`;

module.exports = { getUserIdCommand };
