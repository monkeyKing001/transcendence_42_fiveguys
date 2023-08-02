import axios from "axios";
import * as qs from 'qs';
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class KakaoStrategy{
	constructor(){}
async kakaoLogin(options: { code: string; domain: string }): Promise<any> {
    const { code, domain } = options;
    const kakaoKey = '3e9b70ea0a8eebc3cfae52c685e605bf';
    const kakaoTokenUrl = 'https://kauth.kakao.com/oauth/token';
    const kakaoUserInfoUrl = 'https://kapi.kakao.com/v2/user/me';
    const body = {
      grant_type: 'authorization_code', client_id: kakaoKey,
      redirect_uri: `${domain}`,
      code,
    };
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    };
    try {
      const response = await axios({
        method: 'POST',
        url: kakaoTokenUrl,
        timeout: 30000,
        headers,
        data: qs.stringify(body),
      });
		//success to get token
      if (response.status === 200) {
        console.log(`kakaoToken : ${JSON.stringify(response.data)}`);
		//get info after getting token
        const headerUserInfo = {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          Authorization: 'Bearer ' + response.data.access_token,
        };
        console.log(`url : ${kakaoTokenUrl}`);
        console.log(`headers : ${JSON.stringify(headerUserInfo)}`);
        const responseUserInfo = await axios({
          method: 'GET',
          url: kakaoUserInfoUrl,
          timeout: 30000,
          headers: headerUserInfo,
        });
        console.log(`responseUserInfo.status : ${responseUserInfo.status}`);
		//success
        if (responseUserInfo.status === 200) {
          console.log(
            `kakaoUserInfo : ${JSON.stringify(responseUserInfo.data)}`,
          );
          return responseUserInfo.data;
			//couldn't get kakao info
        } else {
          throw new UnauthorizedException();
        }
		//couldn't get kakaoToken
      } else {
        throw new UnauthorizedException();
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }
}
