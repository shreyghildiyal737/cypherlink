import { Module, Global } from '@nestjs/common';
import { WsGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WebSocketModule {}
