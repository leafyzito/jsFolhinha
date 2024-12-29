const fetch = require('node-fetch');


async function isValidUser(user) {
    // Construct API URL
    const api_url = `https://api.twitch.tv/helix/users?login=${user}`;
    // Set headers with API credentials
    const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
    // Make API request to fetch clips
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    if (data.data.length === 0) { return false; }
    return true;
}


async function shortenUrl(url) {
    const api_url = `https://shlink.mrchuw.com.br/rest/v3/short-urls`;

    const payload = {
        longUrl: url,
        forwardQuery: true,
        findIfExists: true,
    };

    const headers = {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.SHORTURL_CHUW_KEY,
    };

    const response = await fetch(api_url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
    });

    const jsonRes = await response.json();
    if (jsonRes != null) {
        // console.log(jsonRes['shortUrl']);
        return jsonRes['shortUrl'] || url;
    }

    return url;
}


async function createNewGist(content) {
    const api_url = "https://api.github.com/gists";
    const headers = {
        "Authorization": `token ${process.env.GITHUB_GIST_TOKEN}`,
        "Content-Type": "application/json",
    };

    const payload = {
        "public": false,
        "files": {
            "file.txt": {
                "content": content,
            }
        }
    };

    const response = await fetch(api_url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
    });

    // shorten gist url
    const jsonRes = await response.json();
    if (jsonRes != null) {
        const gist_url = jsonRes['html_url'];
        const raw_url = jsonRes['files']['file.txt']['raw_url'];
        const shortenedUrl = shortenUrl(raw_url);
        return (!shortenedUrl ? raw_url : shortenedUrl);
    }

    return null;
}

async function manageLongResponse(content, sendOnlyLink = false) {
    const gist = await createNewGist(content);
    const lenOfGist = gist.length;
    const maxContentLength = 480 - lenOfGist - 10;
    // limit the response to 500 characters, including the gist, add gist link to end of it
    const truncatedContent = content.substring(0, maxContentLength);
    const response = `${truncatedContent}... ${gist}`;
    console.log(gist);

    return sendOnlyLink ? gist : response;
}

const timeSince = (lsDate) => {
    const deltaTime = Math.floor(Date.now() / 1000) - lsDate;

    const tdAFK = {
        days: Math.floor(deltaTime / (3600 * 24)),
        hours: Math.floor((deltaTime % (3600 * 24)) / 3600),
        minutes: Math.floor((deltaTime % 3600) / 60),
        seconds: Math.floor(deltaTime % 60)
    };

    let formattedDeltaTime;
    if (tdAFK.days < 1 && tdAFK.hours < 1 && tdAFK.minutes < 1) {
        formattedDeltaTime = `${tdAFK.seconds}s`;
    } else if (tdAFK.days < 1 && tdAFK.hours < 1) {
        formattedDeltaTime = `${tdAFK.minutes}m ${tdAFK.seconds}s`;
    } else if (tdAFK.days < 1) {
        formattedDeltaTime = `${tdAFK.hours}h ${tdAFK.minutes}m ${tdAFK.seconds}s`;
    } else {
        formattedDeltaTime = `${tdAFK.days}d ${tdAFK.hours}h ${tdAFK.minutes}m ${tdAFK.seconds}s`;
    }

    // clean up zeros
    formattedDeltaTime = formattedDeltaTime.replace(/\b0[d|h|m|s]\b/g, '').trim();

    return formattedDeltaTime;
};

const timeUntil = (futureDate) => {
    const deltaTime = futureDate - Math.floor(Date.now() / 1000);

    const tdUntil = {
        days: Math.floor(deltaTime / (3600 * 24)),
        hours: Math.floor((deltaTime % (3600 * 24)) / 3600),
        minutes: Math.floor((deltaTime % 3600) / 60),
        seconds: Math.floor(deltaTime % 60)
    };

    let formattedDeltaTime;
    if (tdUntil.days < 1 && tdUntil.hours < 1 && tdUntil.minutes < 1) {
        formattedDeltaTime = `${tdUntil.seconds}s`;
    } else if (tdUntil.days < 1 && tdUntil.hours < 1) {
        formattedDeltaTime = `${tdUntil.minutes}m ${tdUntil.seconds}s`;
    } else if (tdUntil.days < 1) {
        formattedDeltaTime = `${tdUntil.hours}h ${tdUntil.minutes}m ${tdUntil.seconds}s`;
    } else {
        formattedDeltaTime = `${tdUntil.days}d ${tdUntil.hours}h ${tdUntil.minutes}m ${tdUntil.seconds}s`;
    }

    // clean up zeros
    formattedDeltaTime = formattedDeltaTime.replace(/\b0[d|h|m|s]\b/g, '').trim();

    return formattedDeltaTime;
};

function timeSinceDT(inputDate) {
    // Parse the given date and time string
    const given_datetime = new Date(inputDate);

    // Get the current date and time
    const current_datetime = new Date();

    // Calculate the difference in years, months, days, hours, and minutes
    let years = current_datetime.getFullYear() - given_datetime.getFullYear();
    let months = current_datetime.getMonth() - given_datetime.getMonth();
    let days = current_datetime.getDate() - given_datetime.getDate();
    let hours = current_datetime.getHours() - given_datetime.getHours();
    let minutes = current_datetime.getMinutes() - given_datetime.getMinutes();

    // Adjust for when the current day is before the given day
    if (days < 0) {
        months--;
        days += new Date(current_datetime.getFullYear(), current_datetime.getMonth(), 0).getDate();
    }

    // Adjust for when the current month is before the given month
    if (months < 0) {
        years--;
        months += 12;
    }

    if (hours < 0) {
        days--;
        hours += 24;
    }

    if (minutes < 0) {
        hours--;
        minutes += 60;
    }

    // Format the follow age string
    let formatted_deltaTime;
    if (years > 0) {
        formatted_deltaTime = `${years}y ${months}m ${days}d ${hours}h ${minutes}m`;
    } else if (months > 0) {
        formatted_deltaTime = `${months}m ${days}d ${hours}h ${minutes}m`;
    } else if (days > 0) {
        formatted_deltaTime = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        formatted_deltaTime = `${hours}h ${minutes}m`;
    } else {
        formatted_deltaTime = `${minutes}m`;
    }

    // Format the follow date string as "dd-mm-yyyy"
    let formattedDate = given_datetime.toLocaleDateString("en-GB").replace(/\//g, '-');

    return [formatted_deltaTime, formattedDate];
}

function timeUntilDT(inputDate) {
    // Parse the given date and time string
    const future_datetime = new Date(inputDate);

    // Get the current date and time
    const current_datetime = new Date();

    // Calculate the difference in years, months, days, hours, and minutes
    let years = future_datetime.getFullYear() - current_datetime.getFullYear();
    let months = future_datetime.getMonth() - current_datetime.getMonth();
    let days = future_datetime.getDate() - current_datetime.getDate();
    let hours = future_datetime.getHours() - current_datetime.getHours();
    let minutes = future_datetime.getMinutes() - current_datetime.getMinutes();

    // Adjust for when the future day is before the current day
    if (days < 0) {
        months--;
        days += new Date(future_datetime.getFullYear(), future_datetime.getMonth(), 0).getDate();
    }

    // Adjust for when the future month is before the current month
    if (months < 0) {
        years--;
        months += 12;
    }

    if (hours < 0) {
        days--;
        hours += 24;
    }

    if (minutes < 0) {
        hours--;
        minutes += 60;
    }

    // Format the time until string
    let formatted_deltaTime;
    if (years > 0) {
        formatted_deltaTime = `${years}y ${months}m ${days}d ${hours}h ${minutes}m`;
    } else if (months > 0) {
        formatted_deltaTime = `${months}m ${days}d ${hours}h ${minutes}m`;
    } else if (days > 0) {
        formatted_deltaTime = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        formatted_deltaTime = `${hours}h ${minutes}m`;
    } else {
        formatted_deltaTime = `${minutes}m`;
    }

    // Format the date string as "dd-mm-yyyy"
    let formattedDate = future_datetime.toLocaleDateString("en-GB").replace(/\//g, '-');

    return [formatted_deltaTime, formattedDate];
}




var streamer_status_cache = {};
async function isStreamOnline(canal, cache_timeout = 60) {
    const current_time = Math.floor(Date.now() / 1000);

    // Check if the streamer's online status is present in the cache and not expired
    if (streamer_status_cache[canal] && (current_time - streamer_status_cache[canal]['timestamp']) < cache_timeout) {
        if (streamer_status_cache[canal]['status'] === "live") {
            return true;
        }
        return false;
    }

    const api_url = `https://api.twitch.tv/helix/streams?user_login=${canal}`;
    const headers = {
        "Client-ID": process.env.BOT_CLIENT_ID,
        "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}`
    };

    const response = await fetch(api_url, { headers });
    const data = await response.json();
    const streamer_status = data.data.length > 0 ? data.data[0].type : "offline";

    // Update the cache with the current status and timestamp
    streamer_status_cache[canal] = {
        'status': streamer_status,
        'timestamp': current_time
    };

    if (streamer_status_cache[canal]['status'] === "live") {
        // console.log('returning true, live on');
        return true;
    }
    // console.log('returning false, live off');
    return false;
}

function parseTime(value, unit) {
    value = parseFloat(value.replace(/,/g, '.'));
    switch (unit) {
        case 'seconds':
        case 'second':
        case 'secs':
        case 's':
            return value;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'm':
            return value * 60;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'h':
            return value * 60 * 60;
        case 'days':
        case 'day':
        case 'd':
            return value * 60 * 60 * 24;
        default:
            return 0;
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function waitForMessage(client, check, timeout = 30_000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve(null);
        }, timeout);

        client.on('PRIVMSG', (msg) => {
            if (msg.senderUsername === check.senderUsername && msg.channelName === check.channelName && check.content.some(content => msg.messageText.toLowerCase() === content.toLowerCase())) {
                clearTimeout(timer);
                resolve(msg);
            }
        });
    });
}


let lastPresenceUpdate = 0;
async function send7tvPresence(message, stv_uid) {
    // console.log('sending 7tv presence');
    const now = Date.now();
    if (now - lastPresenceUpdate < 20000) {
        // console.log('not sending 7tv presence, too soon');
        return null;
    }

    try {
        const response = await fetch(`https://7tv.io/v3/users/${stv_uid}/presences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kind: 1,
                passive: false,
                session_id: undefined,
                data: {
                    platform: 'TWITCH',
                    id: message.channelID
                }
            })
        });

        const data = await response.json();
        // console.log('7tv presence sent:', data);
        lastPresenceUpdate = now;
        return data;
    } catch (err) {
        console.log('Error sending 7TV presence:', err);
        return null;
    }
}

module.exports = {
    isValidUser: isValidUser,
    shortenUrl: shortenUrl,
    randomInt: randomInt,
    randomChoice: randomChoice,
    createNewGist: createNewGist,
    manageLongResponse: manageLongResponse,
    timeSince: timeSince,
    timeSinceDT: timeSinceDT,
    timeUntil: timeUntil,
    timeUntilDT: timeUntilDT,
    isStreamOnline: isStreamOnline,
    parseTime: parseTime,
    capitalize: capitalize,
    waitForMessage: waitForMessage,
    send7tvPresence: send7tvPresence
};
