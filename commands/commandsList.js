const commandsList = {};

// Add aliases to commandsList
const addAliases = (command) => {
    for (let i = 0; i < command.aliases.length; i++) {
        commandsList[command.aliases[i]] = command;
    }
}

// Function to reload all commands
const loadCommands = () => {
    // Clear existing commandsList
    Object.keys(commandsList).forEach((key) => delete commandsList[key]);

    const { testeCommand } = require('./teste/teste.js');
    const { meCommand } = require('./me/me.js');
    const { EightBallCommand } = require('./8ball/8ball.js');
    const { avatarCommand } = require('./avatar/avatar.js');
    const { cachorroCommand } = require('./cachorro/cachorro.js');
    const { gatoCommand } = require('./gato/gato.js');
    const { cancelarCommand } = require('./cancelar/cancelar.js');
    const { chattersCommand } = require('./chatters/chatters.js');
    const { checkNickCommand } = require('./checknick/checknick.js');
    const { coinflipCommand } = require('./coinflip/coinflip.js');
    const { comandosCommand, helpCommand, statsCommand, botStatsCommand } = require('./help/help.js');
    const { cookieCommand, cookieDiarioCommand } = require('./cookie/cookie.js');
    const { copypastaCommand } = require('./copypasta/copypasta.js');
    const { piadaCommand } = require('./piada/piada.js');
    const { curiosidadeCommand } = require('./curiosidade/curiosidade.js');
    const { filosofiaCommand } = require('./filosofia/filosofia.js');
    const { corCommand } = require('./cor/cor.js');
    const { countlineCommand } = require('./countline/countline.js');
    const { dneCommand } = require('./dne/dne.js');
    const { downloadCommand } = require('./download/download.js');
    const { escolhaCommand } = require('./escolha/escolha.js');
    const { fillCommand } = require('./fill/fill.js');
    const { followAgeCommand } = require('./followage/followage.js');
    const { gptCommand, gptSerioCommand } = require('./gpt/gpt.js');
    const { howLongToBeatCommand } = require('./howlongtobeat/howlongtobeat.js');
    const { abracoCommand, beijoCommand, bonkCommand, tuckCommand, slapCommand, explodeCommand } = require('./interacoes/interacoes.js');
    const { lastSeenCommand } = require('./lastseen/lastseen.js');
    const { stalkCommand } = require('./stalk/stalk.js');
    const { liveCommand } = require('./live/live.js');
    const { mathCommand } = require('./math/math.js');
    const { nicksCommand } = require('./nicks/nicks.js');
    const { optoutCommand } = require('./optout/optout.js');
    const { pauseCommand } = require('./pause/pause.js');
    const { unpauseCommand } = require('./pause/pause.js');
    const { configCommand } = require('./config/config.js');
    const { percentagemCommand } = require('./percentagem/percentagem.js');
    const { previewCommand } = require('./preview/preview.js');
    const { roletaCommand } = require('./roleta/roleta.js');
    const { rolarCommand } = require('./rolar/rolar.js');
    const { subAgeCommand } = require('./subage/subage.js');
    const { sugerirCommand } = require('./sugerir/sugerir.js');
    const { talkieCommand } = require('./talkie/talkie.js');
    const { ttsCommand } = require('./tts/tts.js');
    const { petCommand, carinhoCommand, brincarCommand } = require('./pet/pet.js');
    const { afkCommand, rafkCommand } = require('./afk/afk.js');
    const { remindCommand } = require('./remind/remind.js');
    const { userCommand } = require('./user/user.js');
    const { vanishCommand } = require('./vanish/vanish.js');
    const { wikiCommand } = require('./wiki/wiki.js');
    const { joinCommand } = require('./join/join.js');
    const { translateCommand } = require('./translate/translate.js');

    const {
        botSayCommand,
        forceJoinCommand,
        forcePartCommand,
        execCommand,
        getUserIdCommand,
        restartCommand,
        reloadCommand,
        gitPullCommand,
        reloadEmotesCommand,
    } = require('./dev/dev.js');

    // Add aliases for each command
    addAliases(testeCommand);
    addAliases(meCommand);
    addAliases(EightBallCommand);
    addAliases(avatarCommand);
    addAliases(cachorroCommand);
    addAliases(gatoCommand);
    addAliases(cancelarCommand);
    addAliases(chattersCommand);
    addAliases(checkNickCommand);
    addAliases(coinflipCommand);
    addAliases(comandosCommand);
    addAliases(helpCommand);
    addAliases(statsCommand);
    addAliases(botStatsCommand);
    addAliases(cookieCommand);
    addAliases(cookieDiarioCommand);
    addAliases(copypastaCommand);
    addAliases(piadaCommand);
    addAliases(curiosidadeCommand);
    addAliases(filosofiaCommand);
    addAliases(corCommand);
    addAliases(countlineCommand);
    addAliases(dneCommand);
    addAliases(downloadCommand);
    addAliases(escolhaCommand);
    addAliases(fillCommand);
    addAliases(followAgeCommand);
    addAliases(gptCommand);
    addAliases(gptSerioCommand);
    addAliases(howLongToBeatCommand);
    addAliases(abracoCommand);
    addAliases(beijoCommand);
    addAliases(bonkCommand);
    addAliases(tuckCommand);
    addAliases(slapCommand);
    addAliases(explodeCommand);
    addAliases(lastSeenCommand);
    addAliases(stalkCommand);
    addAliases(liveCommand);
    addAliases(mathCommand);
    addAliases(nicksCommand);
    addAliases(optoutCommand);
    addAliases(pauseCommand);
    addAliases(unpauseCommand);
    addAliases(configCommand);
    addAliases(percentagemCommand);
    addAliases(previewCommand);
    addAliases(roletaCommand);
    addAliases(rolarCommand);
    addAliases(subAgeCommand);
    addAliases(sugerirCommand);
    addAliases(talkieCommand);
    addAliases(ttsCommand);
    addAliases(petCommand);
    addAliases(carinhoCommand);
    addAliases(brincarCommand);
    addAliases(afkCommand);
    addAliases(rafkCommand);
    addAliases(remindCommand);
    addAliases(userCommand);
    addAliases(vanishCommand);
    addAliases(wikiCommand);
    addAliases(joinCommand);
    addAliases(translateCommand);

    // // dev commands
    addAliases(botSayCommand);
    addAliases(forceJoinCommand);
    addAliases(forcePartCommand);
    addAliases(execCommand);
    addAliases(getUserIdCommand);
    addAliases(restartCommand);
    addAliases(reloadCommand);
    addAliases(gitPullCommand);
    addAliases(reloadEmotesCommand);

    return commandsList;
};


// Export the loadCommands function
module.exports = {
    commandsList,
    loadCommands,
};