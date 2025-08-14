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
      throw new Error(
        `Chuw API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    const data = await response.body.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const finalUrl = data[0].shortUrl || null;

    return finalUrl;
  }
}

module.exports = ChuwApi;
