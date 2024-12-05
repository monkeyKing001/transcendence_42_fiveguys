import axios, { AxiosResponse } from "axios";

const serverUrl : string = process.env.REACT_APP_SERVER_URL;

export const apiRequest = <T = any,>(
  method: "get" | "post" | "patch",
  url: string,
  data?: any
): Promise<AxiosResponse<T>> => {
  return axios({
    method,
    url,
    data,
    withCredentials: true,
  });
};


export function getRidi<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/auth/login`);
}


export function postAuthenticate<T = any>(
  fullotp: string
): Promise<AxiosResponse<T>> {
  return apiRequest("post", `${serverUrl}/2fa/authenticate`, {
    twoFactorAuthCode: fullotp,
  });
}

export function postRegister<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("post", `${serverUrl}/2fa/register`);
}

export function post2faEnable<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("post", `${serverUrl}/2fa/enable`);
}

export function post2faDisable<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("post", `${serverUrl}/2fa/disable`);
}

export function getWhoami<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/whoami`);
}


export function getLoginfortytwo<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/auth/loginfortytwo/callback`);
}

export function getIntraId<T = any>(
  intraId: string
): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/intraId/${intraId}`);
}

export function getId<T = any>(Id: number): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/id/${Id}`);
}
export function getUserByNickname<T = any>(
  nickname: string
): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/nickname/${nickname}`);
}

export function patchId<T = any>(
  id: number,
  body: {
    nickname?: string;
    profilePicture?: profilePicture;
    currentAvatarData?: boolean;
  }
): Promise<AxiosResponse<T>> {
  return apiRequest("patch", `${serverUrl}/users/${String(id)}`, body);
}

export function patchAddFriend<T = any>(id: number): Promise<AxiosResponse<T>> {
  return apiRequest("patch", `${serverUrl}/users/friends/add/${String(id)}`);
}

export function patchBlockAdd<T = any>(id: string): Promise<AxiosResponse<T>> {
  return apiRequest("patch", `${serverUrl}/users/blocks/add/${id}`);
}

export function patchBlockRemove<T = any>(
  id: string
): Promise<AxiosResponse<T>> {
  return apiRequest("patch", `${serverUrl}/users/blocks/remove/${id}`);
}

export function getBlockList<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/blocks/list`);
}

export function patchDeleteFriend<T = any>(
  id: number
): Promise<AxiosResponse<T>> {
  return apiRequest("patch", `${serverUrl}/users/friends/remove/${String(id)}`);
}

export function getFriendList<T = any>(id: number): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/friends/list`);
}

export function modifyNickname(
  name: string,
  alertFlag: boolean
): Promise<AxiosResponse<any>> {
  return new Promise((resolve, reject) => {
    getWhoami()
      .then((res) => {
        return patchId(res.data.id, { nickname: name });
      })
      .then((response) => {
        if (alertFlag === true) alert("닉네임 수정 성공!");
        resolve(response);
      })
      .catch((error) => {
        if (error.response?.data?.statusCode) alert("닉네임 수정 실패");
        reject(error);
      });
  });
}

type profilePicture = {
  data: ArrayBuffer;
};

export function modifyAvatar(img: File | null): Promise<AxiosResponse<any>> {
  return new Promise((resolve, reject) => {
    if (!img) reject(null);
    getWhoami()
      .then((res) => {
        const reader = new FileReader();
        reader.onload = function (event) {
          const result = event.target?.result;
          if (result) {
            const arrayBuffer = new Uint8Array(result as ArrayBuffer);
            axios
              .patch(
                `${serverUrl}/users/${res.data.id}`,
                {
                  profilePicture: Array.from(arrayBuffer),
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                  withCredentials: true,
                }
              )
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                reject(err);
              });
          }
        };
        if (img)
          reader.readAsArrayBuffer(img);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function modifyFirstCreateFlag() {
  getWhoami()
    .then((res) => {
      patchId(res.data.id, { currentAvatarData: true })
        .then((response) => {
          console.log(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
}

export function getGameLog<T = any>(id: number): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/game/gameStats/id/${String(id)}`);
}

export function getLeaderBoard<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/game/gameStats/leaderBoard`);
}

export function getAllUsers<T = any>(): Promise<AxiosResponse<T>> {
  return apiRequest("get", `${serverUrl}/users/findAll`);
}
