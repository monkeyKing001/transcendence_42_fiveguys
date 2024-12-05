import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from 'src/users/users.module';
import { ChatService } from './chat.service';
@Module({
    imports: [UsersModule],
    providers: [ChatGateway, ChatService],
    exports: [ChatService],
})
export class ChatModule {}