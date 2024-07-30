import { ClientConfiguration } from "../config/config";
import { ClientMixin, ConnectionMixin } from "../mixins/base-mixin";
import { RoomStateTracker } from "../mixins/roomstate-tracker";
import { UserStateTracker } from "../mixins/userstate-tracker";
import { BaseClient } from "./base-client";
import { SingleConnection } from "./connection";
import { ConnectionPool } from "../mixins/connection-pool";
export declare type ConnectionPredicate = (conn: SingleConnection) => boolean;
export declare class ChatClient extends BaseClient {
    get wantedChannels(): Set<string>;
    get joinedChannels(): Set<string>;
    roomStateTracker?: RoomStateTracker;
    userStateTracker?: UserStateTracker;
    connectionPool?: ConnectionPool;
    readonly connectionMixins: ConnectionMixin[];
    readonly connections: SingleConnection[];
    private activeWhisperConn;
    constructor(configuration?: ClientConfiguration);
    connect(): Promise<void>;
    close(): void;
    destroy(error?: Error): void;
    /**
     * Sends a raw IRC command to the server, e.g. <code>JOIN #forsen</code>.
     *
     * Throws an exception if the passed command contains one or more newline characters.
     *
     * @param command Raw IRC command.
     */
    sendRaw(command: string): void;
    join(channelName: string): Promise<void>;
    part(channelName: string): Promise<void>;
    joinAll(channelNames: string[]): Promise<Record<string, Error | undefined>>;
    privmsg(channelName: string, message: string): Promise<void>;
    say(channelName: string, message: string): Promise<void>;
    me(channelName: string, message: string): Promise<void>;
    /**
     * @param messageID The message ID you want to reply to.
     */
    reply(channelName: string, messageID: string, message: string): Promise<void>;
    ping(): Promise<void>;
    newConnection(): SingleConnection;
    use(mixin: ClientMixin): void;
    private reconnectFailedConnection;
    /**
     * Finds a connection from the list of connections that satisfies the given predicate,
     * or if none was found, returns makes a new connection. This means that the given predicate must be specified
     * in a way that a new connection always satisfies it.
     *
     * @param predicate The predicate the connection must fulfill.
     */
    requireConnection(predicate?: ConnectionPredicate): SingleConnection;
}
//# sourceMappingURL=client.d.ts.map