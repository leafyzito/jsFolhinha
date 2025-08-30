require("dotenv").config();
const { RefreshingAuthProvider } = require("@twurple/auth");

const { getTokenData } = require("../../utils/init");

class AuthProvider {
  constructor() {
    // https://twurple.js.org/reference/auth/classes/RefreshingAuthProvider.html
    this.provider = new RefreshingAuthProvider({
      clientId: process.env.BOT_CLIENT_ID,
      clientSecret: process.env.BOT_CLIENT_SECRET,
    });
  }

  async init() {
    // register events
    this.registerEvents();

    // add users from database
    await this.addUsers();

    // tasks are started from main.js
  }

  async addUsers() {
    const tokenDataList = await getTokenData();

    for (const tokenData of tokenDataList) {
      const {
        userId, // not required, but if not present twurple will get from api later internally
        // username, // not required, but useful for intents naming (dealing with users manually later or grouping)
        accessToken,
        refreshToken,
        scope,
        expiresIn,
        obtainmentTimestamp,
      } = tokenData;

      const newTokenData = {
        accessToken: accessToken,
        refreshToken: refreshToken ?? null,
        scope: scope,
        expiresIn: expiresIn ?? null,
        obtainmentTimestamp: obtainmentTimestamp ?? null,
      };
      const intents = []; // [`${username}User`] // if username is available
      userId == process.env.BOT_USERID ? intents.push("chat") : null;
      this.provider.addUser(userId, newTokenData, intents); // no userId: await this.provider.addUserForToken(tokenData);
    }
  }

  registerEvents() {
    this.provider.onRefresh(async (userId, newTokenData) => {
      // console.log(`Token refreshed for userId: ${userId}`);
      // Example: await saveTokenDataToDB(userId, newTokenData);
    });
    this.provider.onRefreshFailure(async (userId, error) => {
      console.error(`Token refresh failed for userId: ${userId}`, error);
      // Example: log to discord, disable features, etc.
    });
  }
}

module.exports = AuthProvider;
