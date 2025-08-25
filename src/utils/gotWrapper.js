const got = require("got");

async function fetchData(url, options = {}) {
  try {
    // Always request as buffer first so we can decide ourselves
    const { rawBody, headers, statusCode } = await got(url, {
      throwHttpErrors: false,
      responseType: "buffer", // keep it raw until we inspect
      ...options,
    });

    if (statusCode < 200 || statusCode > 299) {
      return null;
    }

    // If responseType is explicitly specified, respect it
    if (options.responseType === "text") {
      return rawBody.toString("utf8");
    }

    if (options.responseType === "buffer") {
      return rawBody;
    }

    const contentType = headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      return JSON.parse(rawBody.toString("utf8"));
    }

    if (contentType.startsWith("text/")) {
      return rawBody.toString("utf8");
    }

    // fallback → return raw buffer (useful for images, pdfs, etc.)
    return rawBody;
  } catch (err) {
    console.error("Request error:", err.message);
    return null;
  }
}

module.exports = { fetchData };
