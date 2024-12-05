import React, { useEffect, useRef, useState } from "react";
import "../css/Profile.css";
import "../css/Profile.css";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Buffer } from "buffer"; 
import {  useGameSocket } from "./SocketContext";
import {useCurPage} from "./CurPageContext"

import {
  getWhoami,
  patchAddFriend,
  patchDeleteFriend,
  modifyNickname,
  getFriendList,
  getId,
  modifyAvatar,
  getGameLog,
  post2faDisable,
} from "../utils/ApiRequest";


interface ProfileNode {
  currUser: number;
  isMe: boolean;
  match?: boolean; // Add match prop

}

interface Result {
  key: number;
  date: string;
  winner: string;
  winnerNickName: string;
  loser: string;
  loserNickName: string;
  scoreWinner: number;
  scoreLoser: number;
}


let mAM: string = "modifyAvatarModal";
let mNM: string = "modifyNicknameModal";
let aFM: string = "addFriendModal";
let dFM: string = "deleteFriendModal";
let iGM: string = "inviteGameModal";
let myM: string = "matchAcceptModal"; 
let mnM: string = "matchdenyModal"; 

type profileInfo = {
  id: number;
  nickname: string;
  intra: string;
  avatar: string;
  isMyProfile: boolean;
  isFriendly: boolean;
};

let myInfo: profileInfo = {
  id: -1,
  nickname: "unknown",
  intra: "unknown",
  avatar: "unknown",
  isMyProfile: false,
  isFriendly: false,
};

function Profile(pn: ProfileNode) {
  const { set } = useCurPage();
  const gamesocket = useGameSocket();
  const socket = useGameSocket();
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [info, setInfo] = useState<profileInfo>(myInfo);

  useEffect(() => {
    getWhoami()
      .then((result) => {
        let newInfo: profileInfo = {
          id: result.data.id,
          nickname: result.data.nickname,
          intra: result.data.intraId,
          avatar: "unknown",
          isMyProfile: true,
          isFriendly: false,
        };

        newInfo.id = result.data.id;
        newInfo.nickname = result.data.nickname;
        newInfo.intra = result.data.intraId;

        const bufferData: number[] = result.data.profilePicture.data;
        const buffer: Buffer = Buffer.from(bufferData);
        newInfo.avatar = buffer.toString("base64");

        myInfo = newInfo;
        setInfo(myInfo);
        loadGameLog(myInfo.id, myInfo.nickname);
      })
      .catch((err) => {});
  }, []);

  function ModifyModalButton(props: { modalType: string; callback: (s: string) => void }) {
    const navigate = useNavigate();
    const typeRef = useRef(null);

    return (
      <button
        onClick={() => {
          if (props.modalType === mAM) (window as any)[mAM].showModal();
          else if (props.modalType === mNM) (window as any)[mNM].showModal();
          else if (props.modalType === aFM) (window as any)[aFM].showModal();
          else if (props.modalType === dFM) (window as any)[dFM].showModal();
          else if (props.modalType === iGM) (window as any)[iGM].showModal();
          else if (props.modalType === "false") navigate("/full-tfa");
          else if (props.modalType === "true") {
            post2faDisable();
            toast.error("OTP가 비활성화 되었습니다.", {
              position: toast.POSITION.TOP_LEFT,
              style: {
                width: "500px",
                height: "100px",
                fontSize: "30px",
              },
              autoClose: 1500,
            });
            props.callback("false");
          } else if (props.modalType === myM) {
            if (gamesocket) {
              if (socket)
                socket.emit("acceptOneOnOne", "", (response:boolean) => {
                  if (response === true) set("accept");
                  else set("deny");
                });
            }
          } else if (props.modalType === mnM) {
            if (gamesocket) {
              if (socket)
                socket.emit("denyOneOnOne", "");
              set("deny");
            }

          }
        }}
        className="btn-fix glass"
        ref={typeRef}
      >
        {props.modalType === mAM
          ? "아바타 수정"
          : props.modalType === mNM
          ? "닉네임 수정"
          : props.modalType === aFM
          ? "친구 추가"
          : props.modalType === dFM
          ? "친구 해제"
          : props.modalType === iGM
          ? "게임 초대"
          : props.modalType === "true"
          ? "OTP 해제"
          : props.modalType === "false"
          ? "OTP 설정"
          : props.modalType === myM
          ? "수락"
          : props.modalType === mnM
          ? "거절"
          : "몰루"}
      </button>
    );
  }

  
function ModalWindow(props: { modalType: string }): JSX.Element | null {
  if (props.modalType === mAM) {
    return (
      <dialog id={mAM} className="modal">
        <form method="dialog" className="modal-box">
          <ModifyAvatarSetting />
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    );
  } else if (props.modalType === mNM) {
    return (
      <dialog id={mNM} className="modal">
        <form method="dialog" className="modal-box">
          <ModifyNicknameSetting />
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    );
  } else if (props.modalType === aFM || props.modalType === dFM) {
    return (
      <dialog id={props.modalType === aFM ? aFM : dFM} className="modal">
        <form method="dialog" className="modal-box">
          <FriendButtonSetting targetId={pn.currUser} modalType={props.modalType} />
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    );
  } else if (props.modalType === iGM) {
    return (
      <dialog id={iGM} className="modal">
        <form method="dialog" className="modal-box">
          <InviteGameSetting num={pn.currUser} />
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    );
  }

  return null;
}
  function FriendButtonSetting(props: { targetId: number; modalType: string }) {
    if (props.modalType === aFM) {
      return (
        <button
          onClick={() => {
            patchAddFriend(props.targetId)
              .then((result) => {
                setInfo({ ...info, isFriendly: true });
                alert("친구 추가 성공!");
              })
              .catch((err) => {
                alert("친구 추가 실패");
              });
          }}
        >
          AddFriend
        </button>
      );
    } else {
      return (
        <button
          onClick={() => {
            patchDeleteFriend(props.targetId)
              .then((result) => {
                setInfo({ ...info, isFriendly: false });
                alert("친구 삭제 성공");
              })
              .catch((err) => {
                alert("친구 삭제 실패");
              });
          }}
        >
          DeleteFriend
        </button>
      );
    }
  }

  function InviteGameSetting(props: { num: number }) {
    return (
      <div style={{ flexDirection: "row", justifyContent: "center" }}>
        게임을 신청하시겠습니까?
        <br />
        <button
          style={{ width: "10px", padding: "10px", margin: "0 10px" }}
          onClick={() => {
            if (socket)
              socket.emit("OneOnOne", { targetId: props.num }, (response:number) => {
                if (response === -1) {
                  alert("게임 초대 실패");
                  return;
                }
                set("accept");
              });
          }}
        >
          yes
        </button>
        <button style={{ width: "10px", padding: "10px", margin: "0 10px" }}>
          no
        </button>
      </div>
    );
  }

  function ModifyAvatarSetting() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const image = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const fileSizeKB = files[0].size / 1024;
        if (fileSizeKB > 6000) {
          alert("첨부 파일 크기가 허용 제한을 초과했습니다.");
          if (image.current)
            image.current.value = ""; //확인
          return;
        }
        setSelectedFile(files[0]);
      }
    };

    const handleFileUpload = () => {
      if (selectedFile) {
        modifyAvatar(selectedFile);
        const reader = new FileReader();
        reader.onload = function (event) {
          const result = event.target?.result;
          if (typeof result === "string") {
            setInfo({ ...info, avatar: result.split(",")[1] });
            if (image.current)
              image.current.value = "";
          }
        };
        reader.readAsDataURL(selectedFile);
      }
    };

    return (
      <>
        <h3 className="font-bold text-lg">아바타 수정</h3>
        <input type="file" accept=".jpg, .jpeg, .png" onChange={handleFileChange} ref={image} />
        <button className="avatar-upload" onClick={handleFileUpload}>
          수정하기
        </button>
      </>
    );
  }

  function ModifyNicknameSetting() {
    const textbox = useRef<HTMLInputElement>(null);
    
    const handleFileUpload = () => {
      if (textbox.current) {
        if (textbox.current.value) {
          if (textbox.current.value.search(/[^a-zA-Z0-9!@#$]/g) > -1) {
            alert("닉네임은 영문과 숫자만 가능합니다!!");
            return;
          }
          if (textbox.current.value.length > 13) {
            alert("닉네임은 13 글자를 초과할 수 없습니다.");
            return;
          }
          const newName: string = textbox.current.value;
          modifyNickname(textbox.current.value, false).then((res) => {
            setInfo({ ...info, nickname: newName });
            
          }).catch((error) =>{});
          textbox.current.value = "";
        } else alert("닉네임 수정 실패");
      }
    };

    return (
      <>
        <h3 className="font-bold text-lg">닉네임 수정</h3>
        <input type="text" maxLength={13} ref={textbox} />
        <button className="avatar-upload" onClick={handleFileUpload}>
          수정하기
        </button>
      </>
    );
  }

  function loadGameLog(userId: number, userNick: string) {
    getGameLog(userId)
      .then((result) => {
        let newGameLog: string[] = [];
        result.data.games.forEach((element: Result) => {
          // if (index % 2) {
          if (userNick === element.loserNickName) {
            const log: string =
              element.loserNickName +
              " vs " +
              element.winnerNickName +
              " " +
              element.scoreLoser +
              " : " +
              element.scoreWinner +
              " lose";
            newGameLog = [...newGameLog, log];
          } else if (userNick === element.winnerNickName) {
            const log: string =
              element.winnerNickName +
              " vs " +
              element.loserNickName +
              " " +
              element.scoreWinner +
              " : " +
              element.scoreLoser +
              " win";
            newGameLog = [...newGameLog, log];
            // }
          }
        });
        setGameLog(newGameLog);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  const [twoFA, setTwoFA] = useState("false");
  useEffect(()=> {
    getWhoami()
    .then((my) => {
        if (!my.data.twoFA) setTwoFA("false");
        else setTwoFA("true");
      })
  },[]);
  let tmpInfo: profileInfo = {
    id: -1,
    nickname: "unknown",
    intra: "unknown",
    avatar: "unknown",
    isMyProfile: false,
    isFriendly: false,
  };
  function LoadUserInfo() {
    useEffect(() => {
      getWhoami()
        .then((my) => {
          if (pn.currUser === my.data.id) {
            setInfo(myInfo);
            loadGameLog(info.id, info.nickname);
          } else {
            if (pn.currUser !== 0) {
              getId(pn.currUser)
                .then((target) => {
                  console.log("123");
                  tmpInfo.nickname = target.data.nickname;
                  tmpInfo.isMyProfile = false;
                  const bufferData: number[] = target.data.profilePicture.data;
                  const buffer: Buffer = Buffer.from(bufferData);
                  tmpInfo.avatar = buffer.toString("base64");
                  loadGameLog(target.data.id, target.data.nickname);
                  getFriendList(pn.currUser)
                    .then((res) => {
                      res.data.forEach((element:profileInfo) => { //확인
                        if (element.id === pn.currUser) tmpInfo.isFriendly = true;
                      });
                      setInfo(tmpInfo);
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }, []);
  }
  const changeTwoFA = (s:string) => {

    setTwoFA(s);
  };

  LoadUserInfo();

  return (
    <div className="my-profile-container">
      <div className="avatar-button-div">
        <div className="avatar-wrapper">
          <img
            src={`data:image/jpeg;base64,${info.avatar}`}
            alt="profile"
            className="avatar-img"
          ></img>
        </div>
        <div className="my-nickname">{info.nickname}</div>
        <div className="fix-profile">
          {(pn.isMe || pn.currUser !== info.id) && (
            <>
              <div className="modal-avatar">
                <ModifyModalButton
                  modalType={
                    pn.match
                      ? myM
                      : info.isMyProfile
                      ? mAM
                      : info.isFriendly
                      ? dFM
                      : aFM
                  }
                  callback={changeTwoFA}
                />
                <ModalWindow
                  modalType={info.isMyProfile ? mAM : info.isFriendly ? dFM : aFM}
                />
              </div>
              <div className="modal-nickname">
                <ModifyModalButton
                  modalType={pn.match ? mnM : info.isMyProfile ? mNM : iGM}
                  callback={changeTwoFA}
                />
                <ModalWindow modalType={info.isMyProfile ? mNM : iGM} />
              </div>
              {info.isMyProfile && (
                <div className="2fa">
                  <ModifyModalButton modalType={twoFA} callback={changeTwoFA} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="nickname-history-div">
        <div className="history">
          <ul>
            {gameLog.map((log, index) => (
              <li key={"gameLog " + index}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

const MemoProfile = React.memo(Profile);

export default MemoProfile;
