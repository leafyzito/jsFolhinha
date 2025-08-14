class STVApi {
  constructor() {
    this.baseUrl = "https://7tv.io/v3";
    this.lastPresenceUpdate = 0;
  }

  async updatePresence(stv_uid, channelID, skip_cooldown = false) {
    const now = Date.now();
    if (!skip_cooldown && now - this.lastPresenceUpdate < 20_000) {
      return null;
    }

    this.lastPresenceUpdate = now;

    const response = await fetch(`${this.baseUrl}/users/${stv_uid}/presences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: 1,
        passive: false,
        session_id: undefined,
        data: {
          platform: "TWITCH",
          id: channelID,
        },
      }),
    });
    return response.json();
  }
}

module.exports = STVApi;
