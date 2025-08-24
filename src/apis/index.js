const HelixApi = require("./helix");
const ChuwApi = require("./chuw");
const GithubApi = require("./github");
const IvrApi = require("./ivr");
const RustlogApi = require("./rustlog");
const STVApi = require("./stv");
const FeridinhaApi = require("./feridinha");
const TwitchClipperApi = require("./clipper");
const CobaltApi = require("./cobalt");

const allApis = {
  helix: HelixApi,
  chuw: ChuwApi,
  github: GithubApi,
  ivr: IvrApi,
  rustlog: RustlogApi,
  stv: STVApi,
  feridinha: FeridinhaApi,
  clipper: TwitchClipperApi,
  cobalt: CobaltApi,
};

module.exports = allApis;
