
import { Socket } from 'socket.io-client';
interface Channel {
	channelname:string;
	host?:string | null;
	users:string[];
	state:string;
	member:number;
	maxmember:number;
	option:string;
	password?:number | null;
}

export const where = (socket:Socket | null, id: number): Promise<Channel> => {
	return new Promise((resolve, reject) => {
		if (socket)
		{
			socket.emit('where', id);
			socket.on('where', (channel: Channel) => {
				resolve(channel);
			});
	
			setTimeout(() => {
				reject(new Error('채널 정보를 불러올 수 없습니다.'));
			}, 5000);
		}
	});
}