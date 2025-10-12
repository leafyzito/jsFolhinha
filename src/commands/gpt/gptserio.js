const path = require("path");
const { gptClient } = require("./gpt");

async function askGptSerio(message, prompt) {
  const completion = await gptClient.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    messages: [
      {
        role: "system",
        content: "Mantenha a sua resposta séria e faça o que for pedido.",
      },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0].message.content;
}

const gptSerioCommand = async (message) => {
  const prompt = message.args.slice(1).join(" ");

  if (!prompt) {
    return {
      reply: `Use o formato: ${message.prefix}gptserio <qualquer coisa>`,
    };
  }

  try {
    const gptRes = await askGptSerio(message, prompt);

    if (gptRes.length > 490) {
      const longResponse = await fb.utils.manageLongResponse(gptRes);
      return {
        reply: `🤖 ${longResponse}`,
      };
    }

    return {
      reply: `🤖 ${gptRes.replace(/(\r\n|\n|\r)/gm, " ")}`,
    };
  } catch (error) {
    console.error("GPT Serio command error:", error);
    return {
      reply: `Desculpe ${message.senderUsername}, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.`,
    };
  }
};

gptSerioCommand.commandName = "gpt";
gptSerioCommand.aliases = [
  "gptserio",
  "gptsério",
  "chatgptserio",
  "chatgptsério",
];
gptSerioCommand.shortDescription = "Faça uma pergunta para o ChatGPT sério";
gptSerioCommand.cooldown = 15000;
gptSerioCommand.cooldownType = "channel";
gptSerioCommand.whisperable = true;
gptSerioCommand.description = `Envie uma mensagem para o GPT com uma personalidade mais séria e sem teor humorístico`;
gptSerioCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  gptSerioCommand,
};
