const path = require("path");
const fs = require("fs");

class TwitchClipperAPI {
  constructor() {
    this.baseUrl = "http://localhost:8989";
  }

  async makeClip(channelName) {
    try {
      const response = await fb.request(`${this.baseUrl}/clip/${channelName}`);

      // if (response.ok !== 200) {
      //   throw new Error(
      //     `Failed to add channel ${channelId} to rustlog: ${response.statusCode}`
      //   );
      // }

      const data = await response.body.json();

      // Resolve the path to the "clips" folder inside "twitchClipper"
      const clipsFolder = path.join(process.cwd(), "twitchClipper/clips");
      const clipPath = path.join(clipsFolder, data.path.replace(/^\//, ""));
      console.log(clipPath);
      // upload clip to feridinha
      const clipName = path.basename(clipPath);
      const clipContent = fs.readFileSync(clipPath);
      const clipUrl = await fb.api.feridinha.uploadFile(clipContent, clipName);

      return { makeClipUrl: clipUrl };
    } catch (error) {
      fb.discord.logError(`Error in makeClip: ${error.message}`);
      return null;
    }
  }
}

module.exports = TwitchClipperAPI;
