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
        username, // not required, but useful for intents naming (dealing with users manually later or grouping)
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
      const intents = [`${username}User`]; // [`${username}User`] // if username is available
      userId == process.env.BOT_USERID ? intents.push("chat") : null;
      this.provider.addUser(userId, newTokenData, intents); // no userId: await this.provider.addUserForToken(tokenData);
    }
  }

  registerEvents() {
    this.provider.onRefresh(async (userId, newTokenData) => {
      try {
        console.log(`Token refreshed for userId: ${userId}`);

        // Map newTokenData to database format
        const updateData = {
          access_token: newTokenData.accessToken,
          refresh_token: newTokenData.refreshToken,
          scope: newTokenData.scope,
          expires_at: newTokenData.expiresIn
            ? new Date(Date.now() + newTokenData.expiresIn * 1000)
            : null,
          last_used: new Date(),
          is_valid: true,
          failed_attempts: 0,
        };

        // Update the token in the database
        await fb.db.update("auth", { user_id: userId }, { $set: updateData });

        console.log(`Token data updated in database for userId: ${userId}`);
      } catch (error) {
        console.error(
          `Error updating token data for userId: ${userId}:`,
          error
        );
        if (fb.discord && fb.discord.logError) {
          fb.discord.logError(
            `Token refresh database update failed for userId: ${userId} - ${error.message}`
          );
        }
      }
    });
    this.provider.onRefreshFailure(async (userId, error) => {
      try {
        console.error(`Token refresh failed for userId: ${userId}`, error);

        // Update failed attempts in database
        await fb.db.update(
          "auth",
          { user_id: userId },
          {
            $inc: { failed_attempts: 1 },
            $set: {
              last_used: new Date(),
              is_valid: false,
            },
          }
        );

        // Log to discord if available
        if (fb.discord && fb.discord.logError) {
          fb.discord.logError(
            `Token refresh failed for userId: ${userId} - ${error.message}`
          );
        }
      } catch (dbError) {
        console.error(
          `Error updating failed refresh attempt for userId: ${userId}:`,
          dbError
        );
      }
    });
  }
}

module.exports = AuthProvider;
