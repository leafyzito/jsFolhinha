async function addChannelToJustlog(client, channelId) {
    const response = await fetch(`http://localhost:8025/admin/channels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': `${process.env.JUSTLOG_API_KEY}`
        },
        body: JSON.stringify({
            channels: [channelId]
        })
    });

    if (response.status !== 200) {
        client.discord.importantLog(`Erro ao adicionar ${channelId} ao justlog: ${response.statusText}`);
        return false;
    }

    return true;
}

module.exports = {
    addChannelToJustlog
}