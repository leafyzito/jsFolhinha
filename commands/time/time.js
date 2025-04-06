// const { processCommand } = require("../../utils/processCommand.js");

// async function getTime(location) {
//     // Get coordinates from OpenStreetMap API
//     const api_url = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1&addressdetails=1&accept-language=pt-PT`;
//     const response = await fetch(api_url);

//     const data = await response.json();
//     if (data.length === 0) { return null; }

//     const lat = data[0].lat;
//     const lon = data[0].lon;
//     const city = Object.values(data[0].address)[0];
//     const country = data[0].address.country;
//     const displayName = city + ', ' + country;

//     // Get timezone from coordinates using TimeZoneDB API
//     const timeZoneUrl = `https://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.TIMEZONEDB_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`;
//     const tzResponse = await fetch(timeZoneUrl);
//     const tzData = await tzResponse.json();

//     if (tzData.status !== 'OK') { return null; }

//     // Extract hours and minutes directly from the formatted time string
//     const [hours, minutes] = tzData.formatted.split(' ')[1].split(':');
//     const localTime = `${hours}:${minutes}`;

//     return {
//         displayName,
//         localTime,
//         timeZone: tzData.zoneName,
//         gmtOffset: tzData.gmtOffset / 3600
//     };
// }

// const timeCommand = async (client, message) => {
//     message.command = 'time';
//     if (!await processCommand(5000, 'channel', message, client)) return;

//     let timeTargetLocation = message.messageText.split(" ").slice(1).join(" ");
//     let usedDbInfo = false;

//     if (!timeTargetLocation) {
//         // get location from weather db
//         const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
//         if (userWeatherDb.length === 0) {
//             client.log.logAndReply(message, `Você ainda não configurou uma localização. Use ${message.commandPrefix}time set <localização> para configurar`);
//             return;
//         }
//         timeTargetLocation = userWeatherDb[0].location;
//         usedDbInfo = true;
//     }

//     if (timeTargetLocation.split(" ")[0] == 'set') {
//         const location = timeTargetLocation.split(" ").slice(1).join(" ");
//         if (!location) {
//             client.log.logAndReply(message, `Você precisa fornecer uma localização para configurar. Use ${message.commandPrefix}time set <localização>`);
//             return;
//         }

//         if (['secret', 'secreto'].includes(location.toLowerCase())) {
//             const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
//             if (userWeatherDb.length === 0) {
//                 client.log.logAndReply(message, `Você ainda não configurou uma localização. Use ${message.commandPrefix}time set <localização> para configurar`);
//                 return;
//             }
//             const currentSecretState = userWeatherDb[0].secret;
//             await client.db.update('weather', { userId: message.senderUserID }, { $set: { secret: !currentSecretState } });
//             const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
//             client.log.logAndReply(message, `Localização alterada para estado ${!currentSecretState ? 'secreto' : 'público'} ${emote}`);
//             return;
//         }

//         const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
//         if (userWeatherDb.length === 0) {
//             await client.db.insert('weather', { userId: message.senderUserID, location: location, secret: false });
//             const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
//             client.log.logAndReply(message, `Localização configurada com sucesso ${emote}`);
//             return;
//         }
//         await client.db.update('weather', { userId: message.senderUserID }, { $set: { location: location } });
//         const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
//         client.log.logAndReply(message, `Localização configurada com sucesso ${emote}`);
//         return;
//     }

//     const timeInfo = await getTime(timeTargetLocation);
//     if (!timeInfo) {
//         client.log.logAndReply(message, `Localização não encontrada`);
//         return;
//     }

//     // Check if location should be hidden
//     const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
//     if (usedDbInfo && userWeatherDb.length > 0 && userWeatherDb[0].secret) {
//         timeInfo.displayName = '(Localização escondida)';
//     }

//     const gmtString = timeInfo.gmtOffset > 0 ? `+${timeInfo.gmtOffset}` : timeInfo.gmtOffset;
//     client.log.logAndReply(message,
//         `🕐 ${timeInfo.displayName}: ${timeInfo.localTime} (Timezone: GMT${gmtString})`);
// };

// timeCommand.commandName = 'time';
// timeCommand.aliases = ['time', 'hora', 'horas'];
// timeCommand.shortDescription = 'Mostra a hora atual em uma localização específica';
// timeCommand.cooldown = 5000;
// timeCommand.whisperable = true;
// timeCommand.description = `Comando para verificar a hora atual em uma localização específica

// !time {localização} - Verifica a hora atual de uma localização específica fornecida
// !time set {localização} - Configure a sua localização para não ter de especificar todas as vezes, se quiser que seja secreta, use este comando no whisper e depois use o !time set secret
// !time set secret - Alterna o estado da localização entre público e secreto, para que não seja exibida para outros usuários
// !time - Caso tenha configurado uma localização, verifica a hora atual da sua localização configurada

// • Exemplo: !time Portugal - O bot irá responder com a hora atual em Portugal
// • Exemplo: !time Tokyo - O bot irá responder com a hora atual em Tokyo`;
// timeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${timeCommand.commandName}/${timeCommand.commandName}.js`;

// module.exports = {
//     timeCommand,
// }; 