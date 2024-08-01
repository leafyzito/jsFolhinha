const { manageCooldown } = require("../../utils/manageCooldown.js");

function formatDateTime(followedDate) {
    // Parse the given date and time string
    const given_datetime = new Date(followedDate);

    // Get the current date and time
    const current_datetime = new Date();

    // Calculate the difference in years, months, and days
    let years = current_datetime.getFullYear() - given_datetime.getFullYear();
    let months = current_datetime.getMonth() - given_datetime.getMonth();
    let days = current_datetime.getDate() - given_datetime.getDate();

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

    // Format the follow age string
    let formatted_FollowAge = `${years}y ${months}m ${days}d`;

    // Format the follow date string as "dd-mm-yyyy"
    let followDate = given_datetime.toLocaleDateString("en-GB").replace(/\//g, '-');

    return [formatted_FollowAge, followDate];
}

async function getFA(user, channel) {
    const api_url = `https://api.ivr.fi/v2/twitch/subage/${user}/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if ("statusCode" in data) {
        return `${channel} não existe`;
    }

    const followDate = data.followedAt;

    if (followDate == null) {
        return `${user} não segue ${channel}`;
    }

    const formattedTime = formatDateTime(followDate)[0];
    const followDateFormatted = formatDateTime(followDate)[1];

    return [formattedTime, followDateFormatted];
}

const followageCommand = async (client, message) => {
    message.command = 'followage';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    let faTarget = message.senderUsername;
    let faChannelTarget = message.channelName;

    const args = message.messageText.split(' ');

    if (args.length === 2) {
        faChannelTarget = args[1].replace(/^@/, '');
    } else if (args.length === 3) {
        faTarget = args[1].replace(/^@/, '');
        faChannelTarget = args[2].replace(/^@/, '');
    }

    if (faTarget === faChannelTarget) {
        client.log.logAndReply(message, 'Stare ?');
        return;
    }

    const faResult = await getFA(faTarget, faChannelTarget);
    
    // if (['abrir', 'open'].includes(targetCommand)) {
    if (faResult.includes("não existe")) {
        client.log.logAndReply(message, faResult);
        return;
    }

    if (faResult.includes("não segue")) {
        client.log.logAndReply(message, faResult);
        return;
    }

    const faMessage = `${faTarget === message.senderUsername ? 'Você' : `${faTarget}`} segue ${faChannelTarget} há ${faResult[0]} (${faResult[1]})`;
    client.log.logAndReply(message, faMessage);
    return;
};


module.exports = {
    followageCommand: followageCommand,
    followageAliases: ['followage', 'fa']
};