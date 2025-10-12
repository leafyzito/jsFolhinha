class LinearApi {
  constructor() {
    this.baseUrl = "https://api.linear.app/graphql";
    this.apiKey = process.env.LINEAR_API_KEY;

    if (!this.apiKey) {
      console.warn("LINEAR_API_KEY not found in environment variables");
    }
  }

  async createIssue(title, description) {
    if (!this.apiKey) {
      fb.discord.logError("Linear API key not configured");
      return null;
    }

    if (!process.env.LINEAR_TEAM_ID) {
      fb.discord.logError("LINEAR_TEAM_ID not configured");
      return null;
    }

    try {
      const mutation = `
        mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              title
              url
            }
          }
        }
      `;

      const variables = {
        input: {
          title,
          description,
          teamId: process.env.LINEAR_TEAM_ID,
          // optional: labelIds if you want
          labelIds: process.env.LINEAR_LABEL_IDS
            ? process.env.LINEAR_LABEL_IDS.split(",")
            : [],
        },
      };

      const response = await fb.got(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.apiKey,
        },
        json: { query: mutation, variables },
        responseType: "json",
      });

      const result = response.data;

      if (result.errors && result.errors.length > 0) {
        fb.discord.logError(
          `Linear API errors: ${JSON.stringify(result.errors)}`
        );
        return null;
      }

      if (result.issueCreate?.success) {
        return result.issueCreate.issue;
      }

      fb.discord.logError(
        `Linear API did not return success: ${JSON.stringify(result)}`
      );
      return null;
    } catch (error) {
      fb.discord.logError(`Error creating Linear issue: ${error.message}`);
      return null;
    }
  }
}

module.exports = LinearApi;
