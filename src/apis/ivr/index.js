class IvrApi {
  constructor() {
    this.baseUrl = "https://api.ivr.fi/v2/twitch";
  }

  async getUser(username) {
    const response = await fb.request(`${this.baseUrl}/user?login=${username}`);

    if (response.statusCode !== 200) {
      fb.discord.logError(
        `IVR API: ${response.statusCode} - ${response.statusMessage}`
      );
      return null;
    }

    const data = await response.body.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const user = data[0] || {};
    const displayName = user.displayName;
    const userId = user.id;
    const chatColor = user.chatColor ? user.chatColor : "Nenhuma";
    const badge = user.badges?.[0]?.title || "Nenhuma";
    const chatterCount = user.chatterCount;
    const createdInfo = user.createdAt
      ? fb.utils.relativeTime(user.createdAt)
      : [null, null];
    const createdAt = createdInfo[1];
    const createdHowLongAgo = createdInfo[0];
    const followers = user.followers;
    const isLive = !!user.stream;
    const lastStream = user.lastBroadcast?.startedAt
      ? fb.utils.relativeTime(user.lastBroadcast.startedAt)[0]
      : null;
    const isBanned = user.banned;
    const banReason = user.banReason || null;

    return {
      displayName,
      userId,
      chatColor,
      badge,
      chatterCount,
      createdAt,
      createdHowLongAgo,
      followers,
      isLive,
      lastStream,
      isBanned,
      banReason,
    };
  }

  async getLive(username) {
    const response = await fb.request(`${this.baseUrl}/live?login=${username}`);

    if (response.statusCode !== 200) {
      fb.discord.logError(
        `IVR API: ${response.statusCode} - ${response.statusMessage}`
      );
      return null;
    }

    const data = await response.body.json();
    if (data === null || data == [] || data.length === 0) {
      return null;
    }

    const user = data[0] || {};
    const stream = user.stream || null;
    const isLive = !!stream;

    if (isLive) {
      return {
        isLive: true,
        title: stream?.title || null,
        game: stream?.game?.displayName || "(sem categoria)",
        viewers: stream?.viewersCount || 0,
        startedAt: stream?.createdAt || null,
      };
    }

    return {
      isLive: false,
      lastStreamDate: user.lastBroadcast?.startedAt || null,
      lastStreamTitle: user.lastBroadcast?.title || null,
    };
  }

  async getSubAge(user, channel) {
    const response = await fb.request(
      `${this.baseUrl}/subage/${user}/${channel}`
    );

    if (response.statusCode !== 200) {
      fb.discord.logError(
        `IVR API: ${response.statusCode} - ${response.statusMessage}`
      );
      return null;
    }

    const data = await response.body.json();

    if (data?.statusCode) {
      return null;
    }

    const isActiveSub = data.meta !== null;
    const hasSubbed = data.cumulative !== null;
    const monthsActive = data.cumulative?.months ?? 0;
    const streakMonths = data.streak?.months ?? 0;
    const endsAt = data.meta?.endsAt ?? null;
    const subscriptionType = data.meta?.type ?? null;
    const subscriptionTier = data.meta?.tier ?? null;

    return {
      isActiveSub,
      hasSubbed,
      monthsActive,
      streakMonths,
      endsAt,
      subscriptionType,
      subscriptionTier,
      user: data.user,
      channel: data.channel,
      followedAt: data.followedAt ?? null,
    };
  }
}

module.exports = IvrApi;
