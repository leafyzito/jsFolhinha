const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
require("dayjs/locale/pt"); // Import Portuguese locale

dayjs.extend(relativeTime);
dayjs.locale("pt"); // Set locale globally

const { CreateRegex } = require("../../extras/Regex.js");

const regexObj = new CreateRegex();

class Utils {
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  relativeTime(input, returnOnlyTime = false, compact = true) {
    let date;

    // Handle string numbers (e.g., "1725892920")
    if (typeof input === "string" && /^\d+$/.test(input)) {
      input = Number(input);
    }

    if (typeof input === "number") {
      // Detect if it's in seconds or milliseconds
      date =
        input.toString().length === 10
          ? dayjs.unix(input) // seconds
          : dayjs(input); // milliseconds
    } else {
      // This will handle Date objects and ISO date strings
      date = dayjs(input);
    }

    if (!compact) {
      // Default full format ("há 2 dias", "em 1 hora", etc.)
      return date.fromNow();
    }

    // Compact format logic with support for days, months, and years
    const now = dayjs();
    const isFuture = date.isAfter(now);
    let diff = Math.abs(now.diff(date, "second")); // difference in seconds

    const units = [];

    // Calculate years
    const years = Math.floor(diff / (365 * 24 * 3600));
    if (years > 0) {
      units.push(`${years}a`);
      diff -= years * 365 * 24 * 3600;
    }

    // Calculate months (approximate, using 30 days)
    const months = Math.floor(diff / (30 * 24 * 3600));
    if (months > 0) {
      units.push(`${months}me`);
      diff -= months * 30 * 24 * 3600;
    }

    // Calculate weeks (7 days)
    const weeks = Math.floor(diff / (7 * 24 * 3600));
    if (weeks > 0) {
      units.push(`${weeks}se`);
      diff -= weeks * 7 * 24 * 3600;
    }

    // Calculate days
    const days = Math.floor(diff / (24 * 3600));
    if (days > 0) {
      units.push(`${days}d`);
      diff -= days * 24 * 3600;
    }

    // Calculate hours
    const hours = Math.floor(diff / 3600);
    if (hours > 0) {
      units.push(`${hours}h`);
      diff -= hours * 3600;
    }

    // Calculate minutes
    const minutes = Math.floor(diff / 60);
    if (minutes > 0) {
      units.push(`${minutes}m`);
      diff -= minutes * 60;
    }

    // Calculate seconds (only if no other units or if it's a very short time)
    const seconds = diff;
    if (
      units.length === 0 ||
      (years === 0 &&
        months === 0 &&
        weeks === 0 &&
        days === 0 &&
        hours === 0 &&
        minutes === 0)
    ) {
      units.push(`${seconds}s`);
    }

    if (returnOnlyTime) {
      return units.join(" ");
    }

    return `${isFuture ? "em" : "há"} ${units.join(" ")}`;
  }

  unix(date = new Date()) {
    return Math.floor(date.getTime() / 1000);
  }

  waitForWhisper(check, timeout = 30_000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(null);
      }, timeout);

      fb.twitch.client.on("WHISPER", (msg) => {
        if (
          check.senderUsername &&
          msg.senderUsername === check.senderUsername &&
          msg.channelName === check.channelName &&
          check.content.some(
            (content) => msg.messageText.toLowerCase() === content.toLowerCase()
          )
        ) {
          clearTimeout(timer);
          resolve(msg);
        } else if (
          !check.senderUsername &&
          msg.channelName === check.channelName &&
          check.content.some(
            (content) => msg.messageText.toLowerCase() === content.toLowerCase()
          )
        ) {
          clearTimeout(timer);
          resolve(msg);
        }
      });
    });
  }

  async manageLongResponse(content, sendOnlyLink = false) {
    const gist = await fb.api.github.createGist(content);
    const gist_url = gist.gist_url;
    // const raw_url = gist.raw_url;
    const gistLen = gist_url.length;
    const maxContentLength = 480 - gistLen - 10;
    // limit the response to 500 characters, including the gist, add gist link to end of it
    const truncatedContent = content.substring(0, maxContentLength);
    const response = `${truncatedContent}... ${gist_url}`;
    console.log(response);

    return sendOnlyLink ? gist_url : response;
  }

  checkRegex(content, channelName, message = null) {
    const result = regexObj.check(content, content.split(" "), channelName);
    if (result.caught) {
      console.log(
        `* Caught by ${result.caughtCategory} (${result.matchedWord}) - original content: ${content}`
      );
      fb.discord.importantLog(
        `* Caught by ${result.caughtCategory} (${result.matchedWord}) - original content: ${content}`
      );
      if (message) {
        if (!message.notes) {
          message.notes = "";
        }
        message.notes =
          message.notes +
          `Caught by: ${result.caughtCategory} (${result.matchedWord}) - Original content: ${content}`;
      }
      content =
        "⚠️ Mensagem retida por conter conteúdo banido, tente novamente ou mude um pouco o comando";
    }
    return content;
  }

  async createNewChannelConfig(channelId) {
    const channelName = (await fb.api.helix.getUserByID(channelId)).login;
    const newConfig = {
      channel: channelName,
      channelId: channelId,
      prefix: "!",
      offlineOnly: false,
      isPaused: false,
      disabledCommands: [],
      devBanCommands: [],
    };

    await fb.db.insert("config", newConfig);
    await fb.api.rustlog.addChannel(channelId);
  }

  async waitForMessage(check, timeout = 30_000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(null);
      }, timeout);

      fb.twitch.anonClient.on("PRIVMSG", (msg) => {
        if (msg.replyParentMessageID) {
          msg.messageText = msg.messageText
            .split(" ")
            .slice(1)
            .join(" ")
            .trim();
          console.log(msg.messageText);
        }
        if (
          msg.channelName === check.channelName &&
          check.content.some(
            (content) =>
              msg.messageText.toLowerCase().trim() ===
              content.toLowerCase().trim()
          )
        ) {
          clearTimeout(timer);
          resolve(msg);
        }
      });
    });
  }
}

module.exports = Utils;
