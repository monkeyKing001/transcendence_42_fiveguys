import { Socket } from "socket.io";


//* chat-req & rep obj
export class chatDTO {
    id: number;
    target: number;
    flag: string; // broad or dm
    msg: string;
}

//* kick-req obj
export class kickDTO {
    id: number;
    target: number;
}

//* join-req obj
export class joinDTO {
    id: number;
    channelname: string;
    password?: string | null;
}

//* create & modify-req obj
export class roomDTO {
    id: number;
    maxmember: number;
    option: string;
    password?: string | null;
}

//* op-req obj
export class opDTO {
    id: number;
    target: number;
}

export class banDTO {
    user: number;
    target: number;
}


//* where-rep obj
//* 채널 객체
export interface channelDTO {
    channelname?: string | null;
    host?: number | null; //home의 경우 host 없음.
    operator: number[];
    users: number[];
    member: number;
    maxmember: number;
    option: string;
    password?: string | null;
    mute: boolean;
    banlist: number[];
    channel_id: number;
    gamestate: boolean;
}

//* userDTO (서버에서 관리)
export interface userDTO {
    socketid: string;
    id: number;
    channelname: string;
    socket: Socket;
    interval: NodeJS.Timeout;
    blocklist: Map<number, string>;
}

//* gameDTO
export class gameDTO {
    host: number;
    target: number;
}
