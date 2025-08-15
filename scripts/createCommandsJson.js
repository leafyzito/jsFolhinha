// this is to gather the info for the website

const fs = require("fs");
const path = require("path");

// load environment variables
require("dotenv").config();
const { loadCommands } = require("./commands/commandsList.js");

const rawCommandsList = loadCommands();

const agoraVai = {};

const loadCommands2 = () => {
  // Clear existing commandsList
  // console.log(rawCommandsList);

  const teste = Object.entries(rawCommandsList);

  for (const [, value] of teste) {
    const commandName = value.commandName;
    const aliases = value.aliases;
    const shortDescription = value.shortDescription;
    const cooldown = value.cooldown;
    const whisperable = value.whisperable;
    const description = value.description;
    const code = value.code;
    const emojis = value.emojis ? value.emojis : null;
    const langCodes = value.langCodes ? value.langCodes : null;

    console.log(
      commandName,
      aliases,
      shortDescription,
      cooldown,
      whisperable,
      description,
      code
    );

    if (
      !commandName ||
      !aliases ||
      !shortDescription ||
      (!cooldown && cooldown != 0) ||
      whisperable == null ||
      !description ||
      !code
    ) {
      console.log("não existe, skipping");
      continue;
    }

    // if already existes, skip
    if (agoraVai[commandName]) {
      console.log("já existe");
      continue;
    }

    agoraVai[commandName] = {
      commandName: commandName,
      aliases: aliases,
      shortDescription: shortDescription,
      cooldown: cooldown,
      whisperable: whisperable,
      description: description,
      code: code,
    };
    if (emojis) {
      agoraVai[commandName]["emojis"] = emojis;
    }
    if (langCodes) {
      agoraVai[commandName]["langCodes"] = langCodes;
    }
  }

  // console.log(agoraVai);

  return agoraVai;
};

let jsonToSave = loadCommands2();

// sort jsonToSave by keys
jsonToSave = Object.fromEntries(
  Object.entries(jsonToSave).sort((a, b) => a[0].localeCompare(b[0]))
);

fs.writeFileSync(
  path.join(__dirname, "commands.json"),
  JSON.stringify(jsonToSave, null, 2)
);

console.log("a");
