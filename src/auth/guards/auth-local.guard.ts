import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

//how can pass the guard?
//it will pass if the strategy validate function pass the request!!
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
