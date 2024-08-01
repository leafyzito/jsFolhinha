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
const { comandosCommand, comandosAliases } = require('./comandos/comandos.js');
const { cookieCommand, cookieAliases, cookieDiarioCommand, cookieDiarioAliases } = require('./cookie/cookie.js');
const { copypastaCommand, copypastaAliases } = require('./copypasta/copypasta.js');
const { piadaCommand, piadaAliases } = require('./piada/piada.js');
const { curiosidadeCommand, curiosidadeAliases } = require('./curiosidade/curiosidade.js');
const { corCommand, corAliases } = require('./cor/cor.js');
const { countlineCommand, countlineAliases } = require('./countline/countline.js');
const { dneCommand, dneAliases } = require('./dne/dne.js');
const { downloadCommand, downloadAliases } = require('./download/download.js');
const { escolhaCommand, escolhaAliases } = require('./escolha/escolha.js');

const { 
    botSayCommand, botSayAliases,
    forceJoinCommand, forceJoinAliases,
    execCommand, execAliases,
    getUserIdCommand, getUserIdAliases, 
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
addAliases(cookieCommand, cookieAliases);
addAliases(cookieDiarioCommand, cookieDiarioAliases);
addAliases(copypastaCommand, copypastaAliases);
addAliases(piadaCommand, piadaAliases);
addAliases(curiosidadeCommand, curiosidadeAliases);
addAliases(corCommand, corAliases);
addAliases(countlineCommand, countlineAliases);
addAliases(dneCommand, dneAliases);
addAliases(downloadCommand, downloadAliases);
addAliases(escolhaCommand, escolhaAliases);

// dev commands
addAliases(botSayCommand, botSayAliases);
addAliases(forceJoinCommand, forceJoinAliases);
addAliases(execCommand, execAliases);
addAliases(getUserIdCommand, getUserIdAliases);


module.exports = {
    commandsList: commandsList,
};