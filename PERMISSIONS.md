# Command Permissions System

This document explains how to use the new permission system for commands in jsFolhinha.

## Overview

The permission system allows you to restrict command usage based on user roles and permissions. If no permissions are specified, the command is available to everyone.

## How to Use

Add a `permissions` field to your command object:

```javascript
testeCommand.permissions = ["mod", "admin"]; // Multiple permission levels
```

## Available Permission Levels

### `"mod"`

- Twitch moderators
- Channel owners/streamers (they automatically have mod permissions)

### `"vip"`

- Twitch VIPs

### `"subscriber"`

- Channel subscribers

### `"admin"`

- Custom admin users (defined in `ADMIN_USERS` environment variable)
- Format: `ADMIN_USERS=userid1,userid2,userid3`

### `"streamer"`

- Only the channel owner (this is automatically checked via `message.isStreamer`)

## Examples

### Moderator-only command

```javascript
testeCommand.permissions = ["mod"];
```

### VIP and subscriber command

```javascript
testeCommand.permissions = ["vip", "subscriber"];
```

### Admin-only command

```javascript
testeCommand.permissions = ["admin"];
```

### No restrictions (default)

```javascript
// Don't add permissions field, or set to undefined
testeCommand.permissions = undefined;
```

## Permission Hierarchy

1. **Streamers** - Always have access to all commands
2. **Moderators** - Have access to mod-level commands
3. **VIPs** - Have access to VIP-level commands
4. **Subscribers** - Have access to subscriber-level commands
5. **Admins** - Have access to admin-level commands (if properly configured)

## Environment Variable Setup

To use admin permissions, add this to your `.env` file:

```bash
ADMIN_USERS=123456789,987654321
```

Replace the numbers with actual Twitch user IDs of users who should have admin access.

## Error Messages

When a user doesn't have permission to use a command, they'll see:

```
⚠️ Você não tem permissão para usar este comando
```

## Implementation Details

The permission system is implemented in `src/commands/commandValidator.js` and checks permissions before executing any command. The system is designed to be:

- **Backward compatible** - Commands without permissions work as before
- **Flexible** - Multiple permission levels can be combined
- **Efficient** - Permission checks happen early in the validation process
- **Extensible** - Easy to add new permission types in the future
