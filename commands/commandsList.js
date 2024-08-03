const { testeCommand, testeAliases } = require('./teste/teste.js');
const { meCommand, meAliases } = require('./me/me.js');
const { EightBallCommand, EightBallAliases } = require('./8ball/8ball.js');
const { avatarCommand, avatarAliases } = require('./avatar/avatar.js');
const { cachorroCommand, cachorroAliases } = require('./cachorro/cachorro.js');
const { gatoCommand, gatoAliases } = require('./gato/gato.js');
const { cancelarCommand, cancelarAliases } = require('./cancelar/cancelar.js');
const { chattersCommand, chattersAliases } = require('./chatters/chatters.js');
const { checkNickCommand, checkNickAliases } = require('./checknick/checknick.js');
const { coinflipCommand, coinflipAliases } = require('./coinflip/coinflip.js');
const { comandosCommand, comandosAliases, helpCommand, helpAliases } = require('./help/help.js');
const { cookieCommand, cookieAliases, cookieDiarioCommand, cookieDiarioAliases } = require('./cookie/cookie.js');
const { copypastaCommand, copypastaAliases } = require('./copypasta/copypasta.js');
const { piadaCommand, piadaAliases } = require('./piada/piada.js');
const { curiosidadeCommand, curiosidadeAliases } = require('./curiosidade/curiosidade.js');
const { filosofiaCommand, filosofiaAliases } = require('./filosofia/filosofia.js');
const { corCommand, corAliases } = require('./cor/cor.js');
const { countlineCommand, countlineAliases } = require('./countline/countline.js');
const { dneCommand, dneAliases } = require('./dne/dne.js');
const { downloadCommand, downloadAliases } = require('./download/download.js');
const { escolhaCommand, escolhaAliases } = require('./escolha/escolha.js');
const { fillCommand, fillAliases } = require('./fill/fill.js');
const { followageCommand, followageAliases } = require('./followage/followage.js');
const { gptCommand, gptAliases, gptSerioCommand, gptSerioAliases } = require('./gpt/gpt.js');
const { howLongToBeatCommand, howLongToBeatAliases } = require('./howlongtobeat/howlongtobeat.js');
const { abracoCommand, abracoAliases, beijoCommand, beijoAliases, bonkCommand, bonkAliases, tuckCommand, tuckAliases, slapCommand, slapAliases, explodeCommand, explodeAliases } = require('./interacoes/interacoes.js');
const { lastSeenCommand, lastSeenAliases } = require('./lastseen/lastseen.js');
const { stalkCommand, stalkAliases } = require('./stalk/stalk.js');
const { liveCommand, liveAliases } = require('./live/live.js');
const { mathCommand, mathAliases } = require('./math/math.js');
const { nicksCommand, nicksAliases } = require('./nicks/nicks.js');
const { optoutCommand, optoutAliases } = require('./optout/optout.js');
const { pauseCommand, pauseAliases } = require('./pause/pause.js');
const { unpauseCommand, unpauseAliases } = require('./pause/pause.js');

const { 
    botSayCommand, botSayAliases,
    forceJoinCommand, forceJoinAliases,
    forcePartCommand, forcePartAliases,
    execCommand, execAliases,
    getUserIdCommand, getUserIdAliases, 
    restartCommand, restartAliases,
} = require('./dev/dev.js');


const commandsList = {};
// Function to add aliases to commandsList
const addAliases = (command, aliases) => {
    aliases.forEach(alias => {
        commandsList[alias] = command;
    });
};

// Add aliases for each command
addAliases(testeCommand, testeAliases);
addAliases(meCommand, meAliases);
addAliases(EightBallCommand, EightBallAliases);
addAliases(avatarCommand, avatarAliases);
addAliases(cachorroCommand, cachorroAliases);
addAliases(gatoCommand, gatoAliases);
addAliases(cancelarCommand, cancelarAliases);
addAliases(chattersCommand, chattersAliases);
addAliases(checkNickCommand, checkNickAliases);
addAliases(coinflipCommand, coinflipAliases);
addAliases(comandosCommand, comandosAliases);
addAliases(helpCommand, helpAliases);
addAliases(cookieCommand, cookieAliases);
addAliases(cookieDiarioCommand, cookieDiarioAliases);
addAliases(copypastaCommand, copypastaAliases);
addAliases(piadaCommand, piadaAliases);
addAliases(curiosidadeCommand, curiosidadeAliases);
addAliases(filosofiaCommand, filosofiaAliases);
addAliases(corCommand, corAliases);
addAliases(countlineCommand, countlineAliases);
addAliases(dneCommand, dneAliases);
addAliases(downloadCommand, downloadAliases);
addAliases(escolhaCommand, escolhaAliases);
addAliases(fillCommand, fillAliases);
addAliases(followageCommand, followageAliases);
addAliases(gptCommand, gptAliases);
addAliases(gptSerioCommand, gptSerioAliases);
addAliases(howLongToBeatCommand, howLongToBeatAliases);
addAliases(abracoCommand, abracoAliases);
addAliases(beijoCommand, beijoAliases);
addAliases(bonkCommand, bonkAliases);
addAliases(tuckCommand, tuckAliases);
addAliases(slapCommand, slapAliases);
addAliases(explodeCommand, explodeAliases);
addAliases(lastSeenCommand, lastSeenAliases);
addAliases(stalkCommand, stalkAliases);
addAliases(liveCommand, liveAliases);
addAliases(mathCommand, mathAliases);
addAliases(nicksCommand, nicksAliases);
addAliases(optoutCommand, optoutAliases);
addAliases(pauseCommand, pauseAliases);
addAliases(unpauseCommand, unpauseAliases);

// dev commands
addAliases(botSayCommand, botSayAliases);
addAliases(forceJoinCommand, forceJoinAliases);
addAliases(forcePartCommand, forcePartAliases);
addAliases(execCommand, execAliases);
addAliases(getUserIdCommand, getUserIdAliases);
addAliases(restartCommand, restartAliases);


module.exports = {
    commandsList: commandsList,
};