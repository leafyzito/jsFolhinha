"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBadges = exports.parseSingleBadge = void 0;
const badge_1 = require("../badge");
const badges_1 = require("../badges");
const parse_error_1 = require("./parse-error");
function parseSingleBadge(badgeSrc) {
    // src format: <badge>/<version>
    // src format for predictions: <badge>/<text with maybe an additional "/" slash or one of those ⸝>
    let badgeName;
    let badgeVersion;
    const firstSeparatorIndex = badgeSrc.indexOf("/");
    if (firstSeparatorIndex === -1) {
        badgeName = badgeSrc;
    }
    else {
        badgeName = badgeSrc.slice(0, firstSeparatorIndex);
        badgeVersion = badgeSrc.slice(firstSeparatorIndex + 1);
    }
    if (badgeName == null || badgeVersion == null) {
        throw new parse_error_1.ParseError(`Badge source "${badgeSrc}" did not contain '/' character`);
    }
    // This is the predictions badge/badge-info, it should have badgeVersion escaped.
    if (badgeName === "predictions") {
        badgeVersion = badgeVersion.replace(/⸝/g, ",");
    }
    if (badgeName.length <= 0) {
        throw new parse_error_1.ParseError(`Empty badge name on badge "${badgeSrc}"`);
    }
    if (badgeVersion.length <= 0) {
        throw new parse_error_1.ParseError(`Empty badge version on badge "${badgeSrc}"`);
    }
    return new badge_1.TwitchBadge(badgeName, badgeVersion);
}
exports.parseSingleBadge = parseSingleBadge;
function parseBadges(badgesSrc) {
    // src format: <badge>/<version>,<badge>/<version>,<badge>/<version>
    if (badgesSrc.length <= 0) {
        return new badges_1.TwitchBadgesList();
    }
    const badges = new badges_1.TwitchBadgesList();
    for (const badgeSrc of badgesSrc.split(",")) {
        badges.push(parseSingleBadge(badgeSrc));
    }
    return badges;
}
exports.parseBadges = parseBadges;
//# sourceMappingURL=badges.js.map