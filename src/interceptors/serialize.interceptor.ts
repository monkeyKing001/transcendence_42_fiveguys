import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';
import { UserDto } from 'src/users/dtos/users.dto';

//Serialize will take class(dto) arguments
interface ClassConstructor {
  new (...args: any[]): {};
}

//make decorator
export function Serialize(dto : ClassConstructor){
	return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
	constructor(private dto: ClassConstructor){}
	//constructor(private dto: any){}
  //implementing NestInterceptor, must implement intercept
  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
	  //Run something before a request is handled
	  //by request handler
//    console.log('Im running before the handler', context);
    return handler.handle().pipe(
      map((data: any) => {
        // Run something before the response is sent out
        console.log('Im running before response is sent out', data);
		return plainToClass(UserDto, data, {
			excludeExtraneousValues: true,
		});
      }),
    );
  }
}
