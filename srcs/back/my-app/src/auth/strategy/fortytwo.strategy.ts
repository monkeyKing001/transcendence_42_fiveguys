import { Strategy } from 'passport-42';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from 'src/users/users.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

//  auth42 strategy
@Injectable()
export class FortytwoStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(FortytwoStrategy.name);

  // The super function calls the 42 strategy constructor with our envir variables.
  // It will asks for user permissions before calling validate().

  constructor(private usersService: UsersService, private http: HttpService) {
    super({
      authorizationURL: process.env.AUTH_URL,
      tokenURL: process.env.TOEKN_URL,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACKURL,
      scope: 'public',
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

  // what we want to do in 42 startegy is whethere we get the intra id, name, photourl
  // validate function's argument is accessToken, refreshToken, porfile!!
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: { id: string },
  ): Promise<any> {
    this.logger.log('Validation executed');
    this.logger.log('access token : ');
    this.logger.log(accessToken);
    this.logger.log('refresh token : ');
    this.logger.log(refreshToken);

    try {
		const req = this.http.get('https://api.intra.42.fr/v2/me', {
		  headers: { Authorization: `Bearer ${accessToken}` },
    }
     );
      const { data } = await lastValueFrom(req);
      if (!data) {
        //throw new UnauthorizedException();
      }
      return data;
    } catch (error) {

      //throw new UnauthorizedException();
    }
  }
}
