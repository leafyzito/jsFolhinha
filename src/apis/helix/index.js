class HelixApi {
  constructor() {
    this.baseUrl = "https://api.twitch.tv/helix";
    this.streamerStatusCache = {};
    this.userCache = new Map(); // Cache for user data
    this.userCacheTimeout = 24 * 60 * 60 * 1000; // 24 hour cache timeout
  }

  async getUserByUsername(username) {
    username = username.toLowerCase();

    // Check cache first
    const cached = this.userCache.get(username);
    if (cached) {
      if (Date.now() - cached.timestamp < this.userCacheTimeout) {
        return cached.data;
      }
      // Cache expired, remove it
      this.userCache.delete(username);
    }

    // Not in cache, make API request
    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
    };
    const response = await fb.request(
      `${this.baseUrl}/users?login=${username}`,
      {
        headers,
      }
    );

    if (response.statusCode !== 200) {
      throw new Error(
        `Helix API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    let data = await response.body.json();
    if (!data) {
      return null;
    }

    data = data.data;

    const userData = {
      id: data[0].id || null,
      login: data[0].login || null,
      displayName: data[0].display_name || null,
      type: data[0].type || null,
      description: data[0].description || null,
      profileImageUrl: data[0].profile_image_url || null,
      offlineImageUrl: data[0].offline_image_url || null,
      viewCount: data[0].view_count || null,
      createdAt: data[0].created_at || null,
    };

    // Cache the result
    this.userCache.set(username, {
      data: userData,
      timestamp: Date.now(),
    });

    return userData;
  }

  async getUserByID(userId) {
    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
    };
    const response = await fb.request(`${this.baseUrl}/users?id=${userId}`, {
      headers,
    });

    if (response.statusCode !== 200) {
      throw new Error(
        `Helix API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    let data = await response.body.json();
    if (!data) {
      return null;
    }

    data = data.data;

    const id = data[0].id || null;
    const login = data[0].login || null;
    const displayName = data[0].display_name || null;
    const type = data[0].type || null;
    const description = data[0].description || null;
    const profileImageUrl = data[0].profile_image_url || null;
    const offlineImageUrl = data[0].offline_image_url || null;
    const viewCount = data[0].view_count || null;
    const createdAt = data[0].created_at || null;

    return {
      id,
      login,
      displayName,
      type,
      description,
      profileImageUrl,
      offlineImageUrl,
      viewCount,
      createdAt,
    };
  }

  async getColor(userId) {
    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
    };
    const response = await fb.request(
      `${this.baseUrl}/chat/color?user_id=${userId}`,
      {
        headers,
      }
    );

    if (response.statusCode !== 200) {
      throw new Error(
        `Helix API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    let data = await response.body.json();
    if (!data) {
      return null;
    }

    data = data.data;

    const user_id = data[0].user_id || null;
    const user_login = data[0].user_login || null;
    const user_name = data[0].user_name || null;
    const color = data[0].color || null;

    return {
      user_id,
      user_login,
      user_name,
      color,
    };
  }

  async getStream(username) {
    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
    };
    const response = await fb.request(
      `${this.baseUrl}/streams?user_login=${username}`,
      {
        headers,
      }
    );

    if (response.statusCode !== 200) {
      throw new Error(
        `Helix API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    let data = await response.body.json();
    if (!data) {
      return null;
    }

    data = data.data;

    const id = data[0].id || null;
    const user_id = data[0].user_id || null;
    const user_login = data[0].user_login || null;
    const user_name = data[0].user_name || null;
    const game_id = data[0].game_id || null;
    const game_name = data[0].game_name || null;
    const type = data[0].type || null;
    const title = data[0].title || null;
    const tags = data[0].tags || null;
    const viewer_count = data[0].viewer_count || null;
    const started_at = data[0].started_at || null;
    const language = data[0].language || null;
    const thumbnail_url = data[0].thumbnail_url || null;
    const is_mature = data[0].is_mature || null;

    return {
      id,
      user_id,
      user_login,
      user_name,
      game_id,
      game_name,
      type,
      title,
      tags,
      viewer_count,
      started_at,
      language,
      thumbnail_url,
      is_mature,
    };
  }

  // Stream status cache to avoid excessive API calls
  async isStreamOnline(channelName, cacheTimeout = 60) {
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if the streamer's online status is present in the cache and not expired
    if (
      this.streamerStatusCache[channelName] &&
      currentTime - this.streamerStatusCache[channelName].timestamp <
        cacheTimeout
    ) {
      return this.streamerStatusCache[channelName].status === "live";
    }

    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
    };

    try {
      const response = await fb.request(
        `${this.baseUrl}/streams?user_login=${channelName}`,
        { headers }
      );

      if (response.statusCode !== 200) {
        throw new Error(
          `Helix API: ${response.statusCode} - ${response.statusMessage}`
        );
      }

      let data = await response.body.json();
      data = data.data;

      const streamerStatus =
        data.data.length > 0 ? data.data[0].type : "offline";

      // Update the cache with the current status and timestamp
      this.streamerStatusCache[channelName] = {
        status: streamerStatus,
        timestamp: currentTime,
      };

      return this.streamerStatusCache[channelName].status === "live";
    } catch (error) {
      // If API call fails, return cached value if available, otherwise false
      if (this.streamerStatusCache[channelName]) {
        return this.streamerStatusCache[channelName].status === "live";
      }
      return false;
    }
  }

  async timeoutUser(channelId, userId, duration, reason) {
    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
    };
    const response = await fb.request(
      `${this.baseUrl}/moderation/bans?broadcaster_id=${channelId}&moderator_id=${process.env.BOT_USERID}`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          data: {
            user_id: userId,
            duration: duration,
            reason: reason,
          },
        }),
      }
    );

    if (response.statusCode === 403) {
      return false; // forbidden
    }

    if (response.statusCode !== 200) {
      throw new Error(
        `Helix API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    return true;
  }

  async whisper(whisperTargetId, content) {
    const headers = {
      "Client-ID": process.env.BOT_CLIENT_ID,
      Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
      "Content-Type": "application/json",
    };
    const response = await fb.request(
      `${this.baseUrl}/whispers?from_user_id=${process.env.BOT_USERID}&to_user_id=${whisperTargetId}`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          message: content,
        }),
      }
    );

    if (response.statusCode === 429) {
      throw new Error("Helix API: Whisper rate limit reached");
    }

    if (response.statusCode !== 200) {
      throw new Error(
        `Helix API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    return true;
  }

  async getManyUsersByUserIDs(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    // Split userIds into chunks of 100 (Twitch API limit)
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < userIds.length; i += chunkSize) {
      chunks.push(userIds.slice(i, i + chunkSize));
    }

    let allUsers = [];

    // Process each chunk
    for (const chunk of chunks) {
      const userIdsToUrl = chunk.join("&id=");
      const headers = {
        "Client-ID": process.env.BOT_CLIENT_ID,
        Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
      };

      try {
        const response = await fb.request(
          `${this.baseUrl}/users?id=${userIdsToUrl}`,
          { headers }
        );

        if (response.statusCode === 200) {
          let data = await response.body.json();
          data = data.data;

          if (data && data.length > 0) {
            data.forEach((user) => {
              const id = user.id || null;
              const login = user.login || null;
              const displayName = user.display_name || null;
              const type = user.type || null;
              const description = user.description || null;
              const profileImageUrl = user.profile_image_url || null;
              const offlineImageUrl = user.offline_image_url || null;
              const viewCount = user.view_count || null;
              const createdAt = user.created_at || null;

              allUsers.push({
                id,
                login,
                displayName,
                type,
                description,
                profileImageUrl,
                offlineImageUrl,
                viewCount,
                createdAt,
              });
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching users for chunk: ${error}`);
        // Continue with other chunks even if one fails
      }
    }

    return allUsers;
  }
}

module.exports = HelixApi;
