class GithubApi {
  constructor() {
    this.baseUrl = "https://api.github.com";
  }

  async createGist(content) {
    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `token ${process.env.GITHUB_GIST_TOKEN}`,
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

    if (response.statusCode !== 200) {
      throw new Error(
        `Github API: ${response.statusCode} - ${response.statusMessage}`
      );
    }

    const data = await response.body.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const gist_url = data[0].html_url || null;
    const raw_url = data[0].files["file.txt"].raw_url || null;

    return { gist_url, raw_url };
  }
}

module.exports = GithubApi;
