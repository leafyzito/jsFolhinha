const { VM } = require("vm2");
const { processCommand } = require("../../utils/processCommand.js");
const { manageLongResponse } = require("../../utils/utils.js");

const jsCommand = async (client, message) => {
    message.command = 'js';
    if (!await processCommand(5000, 'channel', message, client)) return;

    // Extract the code to execute (everything after the command)
    const codeToExecute = message.messageText.slice(message.messageText.indexOf(' ')).trim();

    if (!codeToExecute) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}js <código>`);
        return;
    }

    // Create a safe message object with only necessary properties // not needed for now
    // const safeMessage = {
    //     username: message.username,
    //     userId: message.userId,
    //     channel: message.channel,
    //     messageText: message.messageText,
    //     commandPrefix: message.commandPrefix,
    //     command: message.command,
    //     timestamp: message.timestamp,
    //     // Add any other safe properties you want to expose
    // };


    try {
        // Debug log to see what properties are available
        console.log('Message properties:', Object.keys(message));

        const vm = new VM({
            timeout: 1000,
            sandbox: {
                message,  // so far it's ok to pass the entire message object
                console: {
                    log: (...args) => args.join(' '),
                }
            },
            eval: false,
            wasm: false,
        });

        const wrappedCode = `(() => {
            return ${codeToExecute};
        })()`;

        // Execute the code in the sandbox
        const result = vm.run(wrappedCode);

        // Format the result for output
        let output = typeof result === 'undefined' ? 'undefined' :
            JSON.stringify(result, null, 2);

        // clean \n and \r from output
        output = output.replace(/\n/g, '').replace(/\r/g, '');
        client.log.logAndReply(message, `🤖 ${output.length > 490 ? await manageLongResponse(output) : output}`);
    } catch (error) {
        // clean \n and \r from error.message
        error.message = error.message.replace(/\n/g, '').replace(/\r/g, '');
        client.log.logAndReply(message, `🤖 ${error.message.length > 490 ? await manageLongResponse(error.message) : error.message}`);
    }
};

jsCommand.commandName = 'js';
jsCommand.aliases = ['js', 'javascript', 'eval'];
jsCommand.shortDescription = 'Execute código JavaScript em um ambiente seguro';
jsCommand.cooldown = 5000;
jsCommand.whisperable = true;
jsCommand.description = `Execute código JavaScript em um ambiente seguro
O código é executado com limites e restrições de segurança para evitar comandos maliciosos
Você pode usar as propriedades do objeto 'message', que é o objeto da mensagem que o bot recebeu. Para ver o que tem nele, use o comando: !js message

Esse é um comando mais para os nerds do chat. Se um dia alguém ganhar interesse e quiser que o dev aprofunde este comando para ter mais funcionalidades, fique à vontade para falar com o dev`;
jsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${jsCommand.commandName}/${jsCommand.commandName}.js`;

module.exports = {
    jsCommand,
};
