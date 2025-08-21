class RustlogApi {
  constructor() {
    this.baseUrl = "http://localhost:8025";
  }

  async addChannel(channelId) {
    const response = await fb.got(`${this.baseUrl}/admin/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.RUSTLOG_API_KEY,
      },
      json: {
        channels: [channelId],
      },
    });

    if (!response) {
      fb.discord.logError(
        `Failed to add channel ${channelId} to rustlog: Request failed`
      );
      throw new Error(
        `Failed to add channel ${channelId} to rustlog: Request failed`
      );
    }

    return true;
  }

  async removeChannel(channelId) {
    const response = await fb.got(`${this.baseUrl}/admin/channels`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.RUSTLOG_API_KEY,
      },
      json: {
        channels: [channelId],
      },
    });

    if (!response) {
      fb.discord.logError(
        `Failed to remove channel ${channelId} from rustlog: Request failed`
      );
      throw new Error(
        `Failed to remove channel ${channelId} from rustlog: Request failed`
      );
    }

    return true;
  }
}

module.exports = RustlogApi;
