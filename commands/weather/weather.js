import { processCommand } from '../../utils/processCommand.js';

const weatherCodes = {
    0: '☀️ Céu Limpo',
    1: '🌤️ Predominantemente Limpo',
    2: '⛅ Parcialmente Nublado',
    3: '☁️ Encoberto',
    45: '🌫️ Nevoeiro',
    48: '❄️ Nevoeiro com Geada',
    51: '🌦️ Chuvisco Leve',
    53: '🌧️ Chuvisco Moderada',
    55: '🌧️ Chuvisco Densa',
    56: '🌨️ Chuvisco Congelante Leve',
    57: '🌨️❄️ Chuvisco Congelante Densa',
    61: '🌦️ Chuva Fraca',
    63: '🌧️ Chuva Moderada',
    65: '🌧️🌊 Chuva Forte',
    66: '🌨️ Chuva Congelante Leve',
    67: '🌨️❄️ Chuva Congelante Forte',
    71: '❄️ Neve Fraca',
    73: '❄️☃️ Neve Moderada',
    75: '❄️🌨️ Neve Forte',
    77: '🌨️ Granizo',
    80: '🌦️ Pancadas de Chuva Fracas',
    81: '🌧️ Pancadas de Chuva Moderadas',
    82: '🌧️ Pancadas de Chuva Violentas',
    85: '❄️ Pancadas de Neve Fracas',
    86: '❄️🌨️ Pancadas de Neve Fortes',
    95: '🌩️ Trovoada Fraca ou Moderada',
    96: '⛈️ Trovoada com Granizo Leve',
    99: '⛈️ Trovoada com Granizo Forte',
};

function formatWindDirection(windDirection) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']; // should work xd
    return directions[Math.floor(windDirection / 45)];
}

async function getWeather(location) {
    const api_url = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1&addressdetails=1&accept-language=pt-PT`;
    const response = await fetch(api_url);

    const data = await response.json();
    if (data.length === 0) {
        return null;
    }

    const lat = data[0].lat;
    const lon = data[0].lon;
    const city = Object.values(data[0].address)[0];
    const country = data[0].address.country;
    const displayName = city + ', ' + country;

    const weatherInfo = await getWeatherInfo(displayName, lat, lon);

    return weatherInfo;
}

async function getWeatherInfo(displayName, lat, lon) {
    const api_url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m`;
    const response = await fetch(api_url);
    const data = await response.json();

    const weatherCode = data.current.weather_code;
    const weatherDescription = weatherCodes[weatherCode];
    const temperature = data.current.temperature_2m;
    const humidity = data.current.relative_humidity_2m;
    const feelsLike = data.current.apparent_temperature;
    const precipitation = data.current.precipitation;
    const windSpeed = data.current.wind_speed_10m;
    const windDirection = formatWindDirection(data.current.wind_direction_10m);

    return {
        displayName,
        weatherDescription,
        temperature,
        humidity,
        feelsLike,
        precipitation,
        windSpeed,
        windDirection,
    };
}

const weatherCommand = async (client, message) => {
    message.command = 'weather';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    let weatherTargetLocation = message.messageText.split(' ').slice(1).join(' ');
    let usedDbInfo = false;
    if (!weatherTargetLocation) {
        // get weather location from db
        const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
        if (userWeatherDb.length === 0) {
            client.log.logAndReply(
                message,
                `Você ainda não configurou uma localização. Use ${message.commandPrefix}weather set <localização> para configurar`
            );
            return;
        }
        weatherTargetLocation = userWeatherDb[0].location;
        usedDbInfo = true;
    }

    if (weatherTargetLocation.split(' ')[0] == 'set') {
        const location = weatherTargetLocation.split(' ').slice(1).join(' ');
        if (!location) {
            client.log.logAndReply(
                message,
                `Você precisa fornecer uma localização para configurar. Use ${message.commandPrefix}weather set <localização>`
            );
            return;
        }

        if (['secret', 'secreto'].includes(location.toLowerCase())) {
            const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
            if (userWeatherDb.length === 0) {
                client.log.logAndReply(
                    message,
                    `Você ainda não configurou uma localização. Use ${message.commandPrefix}weather set <localização> para configurar`
                );
                return;
            }
            const currentSecretState = userWeatherDb[0].secret;
            await client.db.update(
                'weather',
                { userId: message.senderUserID },
                { $set: { secret: !currentSecretState } }
            );
            const emote = await client.emotes.getEmoteFromList(
                message.channelName,
                ['joia', 'jumilhao'],
                '👍'
            );
            client.log.logAndReply(
                message,
                `Localização alterada para estado ${!currentSecretState ? 'secreto' : 'público'} ${emote}`
            );
            return;
        }

        const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
        if (userWeatherDb.length === 0) {
            await client.db.insert('weather', {
                userId: message.senderUserID,
                location: location,
                secret: false,
            });
            const emote = await client.emotes.getEmoteFromList(
                message.channelName,
                ['joia', 'jumilhao'],
                '👍'
            );
            client.log.logAndReply(message, `Localização configurada com sucesso ${emote}`);
            return;
        }
        await client.db.update(
            'weather',
            { userId: message.senderUserID },
            { $set: { location: location } }
        );
        const emote = await client.emotes.getEmoteFromList(
            message.channelName,
            ['joia', 'jumilhao'],
            '👍'
        );
        client.log.logAndReply(message, `Localização configurada com sucesso ${emote}`);
        return;
    }

    let weatherInfo = await getWeather(weatherTargetLocation);
    if (!weatherInfo) {
        client.log.logAndReply(message, `Localização não encontrada`);
        return;
    }

    const userWeatherDb = await client.db.get('weather', { userId: message.senderUserID });
    if (usedDbInfo && userWeatherDb.length > 0 && userWeatherDb[0].secret) {
        weatherInfo.displayName = '(Localização escondida)';
    }

    client.log.logAndReply(
        message,
        `${weatherInfo.displayName}: ${weatherInfo.weatherDescription}, ${weatherInfo.temperature}°C (aparente: ${weatherInfo.feelsLike}°C), ${weatherInfo.humidity}% humidade, ${weatherInfo.precipitation !== 0 ? `precipitação: ${weatherInfo.precipitation}mm, ` : ''}${weatherInfo.windSpeed}km/h ${weatherInfo.windDirection}`
    );

    return;
};

weatherCommand.commandName = 'weather';
weatherCommand.aliases = ['weather', 'wt', 'clima'];
weatherCommand.shortDescription = 'Comando para verificar o clima de uma localização';
weatherCommand.cooldown = 5000;
weatherCommand.whisperable = true;
weatherCommand.description = `Comando para verificar o clima de uma localização

!weather {localização} - Verifica o clima de uma localização específica fornecida
!weather set {localização} - Configure a sua localização para não ter de especificar todas as vezes, se quiser que seja secreta, use este comando no whisper e depois use o !weather set secret
!weather set secret - Alterna o estado da localização entre público e secreto, para que não seja exibida para outros usuários
!weather - Caso tenha configurado uma localização, verifica o clima da sua localização configurada`;
weatherCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${weatherCommand.commandName}/${weatherCommand.commandName}.js`;

export { weatherCommand };
