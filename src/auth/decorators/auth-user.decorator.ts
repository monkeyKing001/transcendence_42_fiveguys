import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const currentAuthUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
	request.session.id;
    return data ? request.user?.[data] : request.user;
  },
);
