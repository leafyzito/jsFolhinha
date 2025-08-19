class ChuwApi {
  constructor() {
    this.baseUrl = "https://shlink.mrchuw.com.br/rest/v3";
  }

  async shortenUrl(url) {
    const payload = {
      longUrl: url,
      forwardQuery: true,
      findIfExists: true,
    };

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": process.env.SHORTURL_CHUW_KEY,
    };

    const response = await fb.request(`${this.baseUrl}/short-urls`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.statusCode !== 200) {
      fb.discord.logError(
        `Chuw API: ${response.statusCode} - ${response.statusMessage}`
      );
      return url;
    }

    const data = await response.body.json();
    if (!data || !data.shortUrl) {
      return url;
    }

    return data.shortUrl;
  }
}

module.exports = ChuwApi;
