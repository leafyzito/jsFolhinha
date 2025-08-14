class RustlogApi {
  constructor() {
    this.baseUrl = "http://localhost:8025";
  }

  async addChannel(channelId) {
    const response = await fb.request(`${this.baseUrl}/admin/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.RUSTLOG_API_KEY,
      },
      body: JSON.stringify({
        channels: [channelId],
      }),
    });

    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to add channel ${channelId} to rustlog: ${response.statusCode}`
      );
    }

    return true;
  }

  async removeChannel(channelId) {
    const response = await fb.request(`${this.baseUrl}/admin/channels`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.RUSTLOG_API_KEY,
      },
      body: JSON.stringify({
        channels: [channelId],
      }),
    });

    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to remove channel ${channelId} from rustlog: ${response.statusCode}`
      );
    }

    return true;
  }
}

module.exports = RustlogApi;
