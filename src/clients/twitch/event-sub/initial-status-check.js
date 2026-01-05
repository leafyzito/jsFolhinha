const { ApiClient } = require("@twurple/api");
const { getBroadcasterToken, hasScope } = require("./utils");

/**
 * Check initial bot status (mod/VIP) for a broadcaster
 * @param {string} broadcasterId - The broadcaster's user ID
 */
async function checkInitialStatus(broadcasterId) {
  try {
    // Check if broadcaster token is available
    const broadcasterToken = await getBroadcasterToken(broadcasterId);

    if (!broadcasterToken) {
      console.log(
        `* Skipping initial status check for ${broadcasterId}: broadcaster token not available`
      );
      // Set botIsMod and botIsVip to false as default when token is not available
      await fb.db.update(
        "config",
        { channelId: broadcasterId },
        {
          $set: {
            botIsMod: false,
            botIsVip: false,
          },
        }
      );
      return;
    }

    // Check if bot is a moderator
    let botIsMod = false;
    const hasModScope = await hasScope(broadcasterId, "moderation:read");

    if (hasModScope) {
      try {
        // Create broadcaster-specific ApiClient to use broadcaster's token
        const broadcasterApiClient = new ApiClient({
          authProvider: fb.authProvider.provider,
          userId: broadcasterId,
        });
        const botUserId = process.env.BOT_USERID;

        // Handle paginated results
        let cursor = null;
        do {
          const result = await broadcasterApiClient.moderation.getModerators(
            broadcasterId,
            { after: cursor }
          );

          if (result && result.data) {
            for (const mod of result.data) {
              if (mod.userId === botUserId) {
                botIsMod = true;
                break;
              }
            }
          }
          if (botIsMod) break;
          cursor = result?.pagination?.cursor || null;
        } while (cursor);

        // Fallback: If bot not found in moderator list, check using bot's own token
        // This uses the user:read:moderated_channels scope to check from bot's perspective
        if (!botIsMod && hasModScope) {
          try {
            const botHasModeratedChannelsScope = await hasScope(
              botUserId,
              "user:read:moderated_channels"
            );

            if (botHasModeratedChannelsScope) {
              // Create bot-specific ApiClient to use bot's token
              const botApiClient = new ApiClient({
                authProvider: fb.authProvider.provider,
                userId: botUserId,
              });

              // Check if broadcaster's channel is in bot's moderated channels
              let cursor = null;
              do {
                const result =
                  await botApiClient.moderation.getModeratedChannels(
                    botUserId,
                    {
                      after: cursor,
                    }
                  );

                if (result && result.data) {
                  for (const channel of result.data) {
                    // Check multiple possible property names for broadcaster ID
                    const channelBroadcasterId =
                      channel.broadcasterId ||
                      channel.broadcaster_id ||
                      channel.id ||
                      channel.userId ||
                      channel.user_id;

                    if (
                      channelBroadcasterId === broadcasterId ||
                      String(channelBroadcasterId) === String(broadcasterId)
                    ) {
                      botIsMod = true;
                      break;
                    }
                  }
                }
                if (botIsMod) break;
                cursor = result?.pagination?.cursor || null;
              } while (cursor);
            }
            // If bot not found in moderated channels list, botIsMod remains false
          } catch (error) {
            console.error(
              `Error in fallback moderator check for ${broadcasterId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          `Error checking moderator status for ${broadcasterId}:`,
          error
        );
      }
    }

    // Check if bot is a VIP
    let botIsVip = false;
    const hasVipReadScope = await hasScope(broadcasterId, "channel:read:vips");

    if (hasVipReadScope) {
      try {
        // Create broadcaster-specific ApiClient to use broadcaster's token
        const broadcasterApiClient = new ApiClient({
          authProvider: fb.authProvider.provider,
          userId: broadcasterId,
        });
        const botUserId = process.env.BOT_USERID;

        // Handle paginated results - ensure we check all pages
        let cursor = null;
        let hasMorePages = true;
        do {
          const result = await broadcasterApiClient.channels.getVips(
            broadcasterId,
            cursor ? { after: cursor } : {}
          );
          if (result && result.data) {
            for (const vip of result.data) {
              // Check multiple possible property names for user ID
              // VIP objects might have userId, user.id, or id property
              const vipUserId = vip.userId || vip.user?.id || vip.id;
              if (vipUserId === botUserId) {
                botIsVip = true;
                break;
              }
            }
          }
          if (botIsVip) break;
          // Get cursor for next page
          cursor = result?.pagination?.cursor || null;
          hasMorePages = !!cursor;
        } while (hasMorePages);
      } catch (error) {
        console.error(`Error checking VIP status for ${broadcasterId}:`, error);
      }
    }

    // Update config collection
    await fb.db.update(
      "config",
      { channelId: broadcasterId },
      {
        $set: {
          botIsMod: botIsMod,
          botIsVip: botIsVip,
        },
      }
    );

    console.log(
      `* Initial status for ${broadcasterId}: mod=${botIsMod}, vip=${botIsVip}`
    );
  } catch (error) {
    console.error(`Error checking initial status for ${broadcasterId}:`, error);
    if (fb.discord && fb.discord.logError) {
      fb.discord.logError(
        `Initial status check failed for ${broadcasterId}: ${error.message}`
      );
    }
  }
}

module.exports = {
  checkInitialStatus,
};
