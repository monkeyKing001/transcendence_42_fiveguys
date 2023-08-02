import { Strategy } from 'passport-42';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import {UsersService} from 'src/users/users.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

//  auth42 strategy
@Injectable()
export class FortytwoStrategy extends PassportStrategy(Strategy) {
	  private readonly logger = new Logger(FortytwoStrategy.name);
  
  // The super function calls the 42 strategy constructor with our envir variables.
  // It will asks for user permissions before calling validate().
  
  constructor(private usersService : UsersService, private http: HttpService) {
    super({
//      clientID: process.env.FORTYTWO_ID,
//      clientSecret: process.env.FORTYTWO_APP_SECRET,
//      callbackURL: process.env.AUTH_CALLBACK,
	 authorizationURL: "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-2ba7bd194c505ff9326db61afa5c8f62b677dd535610878d78076cd0137b36b9&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&response_type=code",
	  tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: "u-s4t2ud-2ba7bd194c505ff9326db61afa5c8f62b677dd535610878d78076cd0137b36b9",
      clientSecret: "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",
      callbackURL: "http://localhost:3001/auth/loginfortytwo/callback",
	  scope: "public",
      profileFields: {
        id: function (obj: { id: string }) {
          return String(obj.id);
        },
	  },
    });
  }

  // The validate function is a verify function called by the PassportStrategy.
  // It receives the necessary informations and a function redirecting to the callbackURL.

  // We won't need the tokens since we need the profile only once. 
  // It is used to access the user informations of 42 API after the first access. 
  // (And I don't know if 42 API uses them).

	//what we want to do in 42 startegy is whethere we get the intra id, name, photourl
  // validate function's argument is accessToken, refreshToken, porfile!!
  async validate(
    accessToken: string, 
    refreshToken: string, 
    profile: { id: string },
    ): Promise<any> {
		this.logger.log("Validation executed");
		this.logger.log("access token : ");
		this.logger.log(accessToken);
		this.logger.log("refresh token : ");
		this.logger.log(refreshToken);

		const req = this.http.get('https://api.intra.42.fr/v2/me', {
		  headers: { Authorization: `Bearer ${accessToken}` },
		});

		try {
			const  {data}  = await lastValueFrom(req);
			if (!data) throw new UnauthorizedException();
			return data;
		} catch (error) {}

    throw new UnauthorizedException();
  }
}
