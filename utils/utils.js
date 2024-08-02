const fetch = require('node-fetch');
const { response } = require('express');


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
        return jsonRes['shortUrl'];
    }

    return null;
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

async function manageLongResponse(content){
    const gist = await createNewGist(content);
    const lenOfGist = gist.length;
    const maxContentLength = 480 - lenOfGist - 10;
    // limit the response to 500 characters, including the gist, add gist link to end of it
    const truncatedContent = content.substring(0, maxContentLength);
    const response = `${truncatedContent}... ${gist}`;
    console.log(gist);

    return response;
}


function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
    isValidUser: isValidUser,
    shortenUrl: shortenUrl,
    randomInt: randomInt,
    randomChoice: randomChoice,
    createNewGist: createNewGist,
    manageLongResponse: manageLongResponse,
};
