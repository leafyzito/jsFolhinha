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
    const response = await fb.got(`${this.baseUrl}/gists`, {
      method: "POST",
      headers,
      json: payload,
    });

    if (!response) {
      throw new Error("Github API: Request failed");
    }

    const data = response;
    if (!data) {
      throw new Error("Github API: No data returned");
    }

    const rawUrl = data.files["file.txt"].raw_url;
    const shortenedUrl = await fb.api.chuw.shortenUrl(rawUrl);
    return shortenedUrl ? shortenedUrl : rawUrl;
  }
}

module.exports = GithubApi;
