## Twurple “auth” collection (what it is)

This project uses a MongoDB collection named `auth` as the persisted token store for Twurple’s `RefreshingAuthProvider`.

- **On startup**: `src/utils/init.js#getTokenData()` loads every document from `auth` and `src/clients/twitch/auth-provider.js` calls `RefreshingAuthProvider.addUser(userId, token, intents)`.
- **On refresh**: when Twurple refreshes a token, `auth-provider.js` writes the new `access_token`, `refresh_token`, `scope`, and `expires_at` back into the same `auth` document.

So, if a channel/user is not present (or valid) in `auth`, we can’t subscribe “as that broadcaster”, and listeners are skipped for that channel.

## New EventSub listeners added

These listeners are created via Twurple EventSub WebSockets (`@twurple/eventsub-ws`) for each joined channel **when possible**:

- **Stream online** (`stream.online`)
- **Stream offline** (`stream.offline`)
- **Moderator added** (`channel.moderator.add`)
- **Moderator removed** (`channel.moderator.remove`)

## New scope you must add to user auth

To receive **moderator add/remove** events for a broadcaster’s channel, that broadcaster’s stored token must include:

- **`moderation:read`**

No additional scope is required for **stream online/offline** subscriptions.

