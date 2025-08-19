class GithubApi {
  constructor() {
    this.baseUrl = "https://api.github.com";
  }

  async createGist(content) {
    const headers = {
      Authorization: `token ${process.env.GITHUB_GIST_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "FolhinhaBot",
    };

    const payload = {
      public: false,
      files: { "file.txt": { content } },
    };
    const response = await fb.request(`${this.baseUrl}/gists`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.statusCode !== 201) {
      throw new Error(
        `Github API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    const data = await response.body.json();
    if (!data) {
      throw new Error("Github API: No data returned");
    }

    const rawUrl = data.files["file.txt"].raw_url;
    const shortenedUrl = await fb.api.chuw.shortenUrl(rawUrl);
    return shortenedUrl ? shortenedUrl : rawUrl;
  }
}

module.exports = GithubApi;
