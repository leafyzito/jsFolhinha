// o7


// const { processCommand } = require("../../utils/processCommand.js");

// function getFormattedRemainingTime(seconds) {
//     // convert from ms to seconds
//     seconds = seconds / 1000;
//     if (seconds < 60) {
//         return `${seconds}s`;
//     }

//     const days = (seconds / 86400).toFixed(2);
//     const minutes = Math.floor(seconds / 60);
//     if (minutes < 60) {
//         const secondsLeft = seconds % 60;
//         return `${minutes}m ${secondsLeft}s`;
//     }

//     const hours = Math.floor(minutes / 60);
//     const minutesLeft = minutes % 60;
//     const secondsLeft = seconds % 60;

//     return `${hours}h ${minutesLeft}m ${Math.round(secondsLeft)}s (${days} dias)`;
// }

// async function getMeiaUm() {
//     const api_url = "https://subathon-api.justdavi.dev/api/time-left";
//     const response = await fetch(api_url);
//     if (!response.ok) {
//         return null;
//     };

//     const data = await response.json();
//     const msTimeLeft = data.timeLeft;
//     return getFormattedRemainingTime(msTimeLeft);
// }

// const meiaUmCommand = async (client, message) => {
//     message.command = 'meiaum';
//     if (!await processCommand(5000, 'channel', message, client)) return;

//     const timeLeft = await getMeiaUm();
//     if (!timeLeft) {
//         client.log.logAndReply(message, `A API do timer da subathon está morta, tente novamente mais tarde`);
//         return;
//     }

//     const emote = await client.emotes.getEmoteFromList(message.channelName, ['meiaThon'], '');
//     client.log.logAndReply(message, `Timer atual da subathon do MeiaUm: ${timeLeft} ${emote}`);
//     return;
// };

// meiaUmCommand.commandName = 'meiaum';
// meiaUmCommand.aliases = ['omeiaum', 'meiaum', 'meiaumtimer'];
// meiaUmCommand.shortDescription = 'Veja quanto tempo de live o meiaum ainda tem pela frente';
// meiaUmCommand.cooldown = 5000;
// meiaUmCommand.whisperable = true;
// meiaUmCommand.description = ``;
// meiaUmCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${meiaUmCommand.commandName}/${meiaUmCommand.commandName}.js`;

// module.exports = {
//     meiaUmCommand,
// };
