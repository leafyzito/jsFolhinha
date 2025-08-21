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

    const res = await fb.got(`${this.baseUrl}/short-urls`, {
      method: "POST",
      headers,
      json: payload,
    });

    if (res === null) {
      fb.discord.logError(`Chuw API returned null`);
      return url;
    }
    if (!res || !res.shortUrl) {
      return url;
    }

    return res.shortUrl;
  }
}

module.exports = ChuwApi;
