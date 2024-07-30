const { testeCommand } = require ('./teste/teste.js');
const { meCommand } = require ('./me/me.js');
const { botSayCommand, forceJoinCommand, execCommand } = require ('./dev/dev.js');
const { EightBallCommand } = require ('./8ball/8ball.js');
const { avatarCommand } = require ('./avatar/avatar.js');
const { cachorroCommand } = require ('./cachorro/cachorro.js');
const { gatoCommand } = require ('./gato/gato.js');
const { cancelarCommand } = require ('./cancelar/cancelar.js');
const { chattersCommand } = require ('./chatters/chatters.js');
const { checkNickCommand } = require ('./checknick/checknick.js');
const { coinflipCommand } = require ('./coinflip/coinflip.js');
const { comandosCommand } = require ('./comandos/comandos.js');
const { cookieCommand } = require ('./cookie/cookie.js');

const commandsList = {
    // teste
    teste: testeCommand,
    test: testeCommand,
    testing: testeCommand,
    // me
    me: meCommand,
    // dev commands
    botsay: botSayCommand,
    bsay: botSayCommand,
    forcejoin: forceJoinCommand,
    exec: execCommand,
    // 8ball
    "8ball": EightBallCommand,
    eightball: EightBallCommand,
    // avatar
    avatar: avatarCommand,
    pfp: avatarCommand,
    // cachorro
    dog: cachorroCommand,
    doggo: cachorroCommand,
    cachorro: cachorroCommand,
    cao: cachorroCommand,
    // gato
    gato: gatoCommand,
    cat: gatoCommand,
    // cancelar
    cancelar: cancelarCommand,
    cancel: cancelarCommand,
    // chatters
    chatters: chattersCommand,
    // checknick
    checknick: checkNickCommand,
    nickcheck: checkNickCommand,
    namecheck: checkNickCommand,
    // coinflip
    coinflip: coinflipCommand,
    flipcoin: coinflipCommand,
    cf: coinflipCommand,
    // comandos
    comandos: comandosCommand,
    commands: comandosCommand,
    comando: comandosCommand,
    command: comandosCommand,
    // cookie
    cookie: cookieCommand,
};


module.exports = {
    commandsList: commandsList,
};