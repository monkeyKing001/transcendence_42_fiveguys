import React, {
  useState,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
} from "react";
import { useSocket } from "../component/SocketContext";
import ProfileModal from "../component/ProfileModal";
import Modal from "../component/Modal";
import { whoami } from "../utils/whoami";
import "../css/Chat.css";
import { where } from "../utils/where";
import CreateChat from "./CreateChat";
import SettingChat from "./SettingChat";
import { Buffer } from "buffer";
import {
  getId,
  getUserByNickname,
  patchBlockAdd,
  patchBlockRemove,
  getBlockList,
} from "../utils/ApiRequest";

import { Socket } from "socket.io-client";

interface IUsers {
  name: string;
  profile: any;
  id: number;
  isChecked: boolean;
}

interface IMessage {
  user: IUsers;
  sender: string;
  text: string;
  time: string;
  avatar: string;
}

interface ChatProps {
  memberList: number[];
  type: string; 
}

const initTmpMessages: IMessage[] = [
  {
    user: { name: "SERVER", profile: null, id: 1, isChecked: false },
    sender: "chat chat-start",
    text: "Home 채널에 참가하셨습니다.",
    time: new Date().toLocaleTimeString(),
    avatar: "",
  },
];

function Chat(props:ChatProps) {
  const [users, setUsers] = useState<IUsers[]>([]);
  const [messages, setMessages] = useState<IMessage[]>(initTmpMessages);
  const socket : Socket | null = useSocket();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const init = async () => {
    const data = await whoami();
    const bufferData: number[] = data.profilePicture.data;
    const buffer: Buffer = Buffer.from(bufferData);
    data.profilePicture.data = buffer.toString("base64");
    receiveMessage();
  };

  const receiveMessage = () => {
    if (socket) {
      socket.on("chat", (receiveData) => {
        if (!receiveData) return;
        getId(receiveData.id)
          .then((response) => {
            if (!response.data) return;
            const bufferData: number[] = response.data.profilePicture.data;
            const buffer: Buffer = Buffer.from(bufferData);
            const img: string = buffer.toString("base64");
            addMessage(
              {
                name: response.data.nickname,
                profile: response.data.avatar,
                id: response.data.id,
                isChecked: false,
              },
              receiveData.msg,
              "chat chat-start",
              img
            );
          })
          .catch((error)=>{console.log(error);});
      });
    }
  };

  useEffect(() => {
    if (!socket) return;
    init();
    socket.on("op", (data) => {
      console.log(data);
      if (data) {
        setMessages([]);
        addMessage(
          {
            name: "SERVER",
            profile: null,
            id: 0,
            isChecked: false,
          },
          "채팅방 관리자 권한을 부여 받으셨습니다.",
          "chat chat-start",
          ""
        );
      }
    });
    socket.on("oneOnOne", () => {
      initMessages();
      console.log("initmsg");
    });
    socket.on("kick", (data) => {
      console.log("kick");
      if (data) {
        setMessages([]);
        addMessage(
          {
            name: "SERVER",
            profile: null,
            id: 0,
            isChecked: false,
          },
          "채널에서 강제 퇴장 당하셨습니다.",
          "chat chat-start",
          ""
        );

        addMessage(
          {
            name: "SERVER",
            profile: null,
            id: 0,
            isChecked: false,
          },
          "Home 채널에 참가하셨습니다.",
          "chat chat-start",
          ""
        );
      }
    });
    socket.on("join", (channel) => {
      if (channel.flag) initMessages();
    });
    return () => {
      socket.off("oneOnOne");
      socket.off("chat");
      socket.off("kick");
      socket.off("join");
    };
  }, [socket]);

  const isSameList = () => {
    if (props.memberList.length != users.length) return false;
    for (let i = 0; i < props.memberList.length; i++) {
      if (props.memberList[i] != users[i].id) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      const prevUsers = JSON.parse(JSON.stringify(users));
      const newUsers = [];

      for (let i:number = 0; i < props.memberList.length; i++) {
        try {
          const response = await getId((props.memberList[i]));
          const data = response.data;
          let isAdd = false;

          for (let j = 0; j < prevUsers.length; j++) {
            if (prevUsers[j].id === data.id && prevUsers[j].isChecked) {
              newUsers.push({
                name: data.nickname,
                profile: data.avatar,
                id: data.id,
                isChecked: true,
              });
              isAdd = true;
              break;
            }
          }

          if (!isAdd) {
            newUsers.push({
              name: data.nickname,
              profile: data.avatar,
              id: data.id,
              isChecked: false,
            });
          }
        } catch (error) {
          console.log(error);
        }
      }

      setUsers(newUsers);
    };
    fetchData();
  }, [props.memberList]);

  const addMessage = (
    user: IUsers,
    text: string,
    className: string,
    avatar: string
  ) => {
    const time = new Date().toLocaleTimeString();
    setMessages((prevMessages) => [
      ...prevMessages,
      { user: user, sender: className, text: text, time: time, avatar: avatar },
    ]);
  };

  const scrollToBottom = () => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const chatEnter = async (chat: string) => {
    try {
      const data = await whoami();
      if (chat.substring(0, 7) === "/block ") {
        const target_name: string = chat.substring(7, chat.length);
        if (socket)
          socket.emit("mutelistupdate", data.id);
          getUserByNickname(target_name)
          .then((response) => {
            if (response.data.id === undefined) {
              alert("없는 유저입니다.");
              return;
            }
            patchBlockAdd(response.data.id)
              .then((res) => {
                if (socket)
                  socket.emit("blocklistupdate", data.id);
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });
        chat = "";
        return;
      } else if (chat.substring(0, 9) === "/unblock ") {
        if (socket)
          socket.emit("mutelistupdate", data.id);
        const target_name: string = chat.substring(9, chat.length);
        getUserByNickname(target_name).then((response) => {
          if (response.data.id === undefined) {
            alert("없는 유저입니다.");
            return;
          }
          patchBlockRemove(response.data.id)
            .then((res) => {
              if (socket)
                socket.emit("blocklistupdate", data.id);
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error)=>{ 
          alert("실패");
          return;
        });
        chat = "";
        return;
      } else if (chat.substring(0, 10) === "/blocklist") {
        getBlockList()
          .then((response) => {
            if (!response.data.length) {
              console.log("null response");
              return;
            }
            let msg: string = "[";
            let i: number;
            for (i = 0; i < response.data.length - 1; i++) {
              msg += response.data[i].nickname + ", ";
            }
            msg += response.data[i].nickname + "]";
            addMessage(
              {
                name: data.id,
                profile: null,
                id: data.id,
                isChecked: false,
              },
              msg,
              "chat chat-start",
              ""
            );
          })
          .catch((error) => {
            
            console.log(error);
          });
        chat = "";
        return;
      } 
      else if (chat.substring(0, 5) === "/ban ")
      {
        const banstring:string = chat.substring(5, chat.length);
        getUserByNickname(banstring)
          .then((res)=>{
            if (res.data.id === undefined)
            {
              alert("없는 유저입니다.");
              return;
            }
            else if (socket)
            {
              socket.emit("ban", {user : data.id, target : res.data.id}, (response:number) =>{
              if (response === 1)
                alert("ban 권한이 없습니다.");
              else
                alert("ban 성공");
            });
            }

          })
          .catch((error)=>alert("실패"));
          chat = "";
          return;
      }
      else if (chat.substring(0, 5) === "/mute")
      {
        if (socket)
          socket.emit("mute", data.id, (response:number)=>{
            if (response === 1)
              alert("mute 권한이 없습니다.");
            else if (response === 0)
              alert("mute 성공");
            else if (response === 2)
              alert("현재 mute 상태입니다.");
          });
          chat = "";
          return;
      }
      else if (chat[0] === "/" && chat[1] === "/") {
        const firstSpaceIdx = chat.indexOf(" ");
        if (firstSpaceIdx === -1) return;
        const target_name: string = chat.substring(2, firstSpaceIdx);
        const msg: string = chat.substring(firstSpaceIdx + 1, chat.length);

        getUserByNickname(target_name)
          .then((response) => {
            if (socket) {
              socket.emit("chat", {
                id: data.id,
                target: response.data.id,
                flag: "dm",
                msg: msg,
              });
            }
          })
          .catch((error)=>{
            alert("실패");
          });

        addMessage(
          {
            name: data.nickname,
            profile: null,
            id: data.id,
            isChecked: false,
          },
          chat,
          "chat chat-end",
          ""
        );
        chat = "";
        return;
      } else if (chat.length) {
        where(socket, data.id)
          .then((channel) => {
            if (socket) {
             socket.emit("chat", {
                id: data.id,
                target: channel.channelname,
                flag: "broad",
                msg: chat,
              });
            }

          })
          .catch((error) => {
            console.log(error);
          });
          
        const bufferData: number[] = data.profilePicture.data;
        const buffer: Buffer = Buffer.from(bufferData);
        const img: string = buffer.toString("base64");
        addMessage(
          {
            name: data.nickname,
            profile: null,
            id: data.id,
            isChecked: false,
          },
          chat,
          "chat chat-end",
          img
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleButtonClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const target = inputRef.current as HTMLInputElement;
    console.log(target.value);
    event.preventDefault();
    chatEnter(target.value);
    target.value = "";
  };

  const handleKeyPress = async (event: KeyboardEvent<HTMLInputElement>) => {
    // keyCode는 잘 사용되지 않는다고한다. 추후 리팩토링 예정
    if (event.keyCode === 13 && event.key === "Enter" && !event.shiftKey) {
      const target = event.target as HTMLInputElement;
      event.preventDefault();
      chatEnter(target.value);
      target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      scrollToBottom();
    };
  }, [messages]);

  const kick = async () => {
    try {
      const data = await whoami();
      for (let i: number = 0; i < users.length; i++) {
        if (users[i].isChecked) {
          if (socket) {
            socket.emit("kick", {
              id: data.id,
              target: users[i].id,
            });
            console.log(users[i].name);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const goHome = async () => {
    try {
      const data = await whoami();
      if (socket)
        socket.emit("home", data.id);
      setMessages([]);
      addMessage(
        {
          name: "SERVER",
          profile: null,
          id: 0,
          isChecked: false,
        },
        "Home 채널에 참가하셨습니다.",
        "chat chat-start",
        ""
      );
    } catch (error) {
      console.log(error);
    }
  };

  const givePermission = async () => {
    try {
      const data = await whoami();
      for (let i: number = 0; i < users.length; i++) {
        if (users[i].isChecked) {
          if (socket)
            socket.emit("op", { id: data.id, target: users[i].id });
        }      
      }
    } catch (error) {
      console.log(error);
    }
  };

  const initMessages = async () => {
    setMessages([]);
    try {
      const data = await whoami();

      where(socket, data.id)
        .then((channel) => {
          let chname: string = channel.channelname;
          if (channel.channelname === "$home") chname = "Home";
          addMessage(
            {
              name: "SERVER",
              profile: null,
              id: 0,
              isChecked: false,
            },
            chname + " 채널에 참가하셨습니다.",
            "chat chat-start",
            ""
          );
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = (): void => {
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
  };
  const [chatConfigure, setChatConfigure] = useState("");

  return (
    <>
      <div className="chat-box">
        <div ref={lastMessageRef}>
          {messages.map((message, index) => (
            <div
              className={message.sender}
              ref={index === messages.length - 1 ? lastMessageRef : null}
              key={index}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  <img
                    src={
                      message.avatar
                        ? `data:image/jpeg;base64,${message.avatar}`
                        : "/img/favicon.png"
                    }
                    alt="chat profile img"
                  />
                </div>
              </div>
              <div className="chat-header">
                {message.user.name}
                <time className="text-xs opacity-50">{message.time}</time>
              </div>
              <div className="chat-bubble">{message.text}</div>
              {/* <div className="chat-footer opacity-50"> Seen at {message.time}</div> */}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-input">
        <input
          ref={inputRef}
          type="text"
          placeholder="채팅을 입력하세요."
          className="input input-bordered input-accent w-full max-w-xs"
          onKeyDown={handleKeyPress}
          maxLength={10000}
        />
        <button
          className="btn btn-active btn-primary"
          onClick={handleButtonClick}
        >
          ↵
        </button>
      </div>
      <div className="chat-member-list">
        <ul>
          {users.map((user, index) => (
            <li key={"chat" + index}>
              <input
                type="checkbox"
                checked={users[index].isChecked}
                onChange={() => {
                  setUsers((prevUsers) => {
                    return prevUsers.map((prevUser) => {
                      if (prevUser.id === user.id) {
                        return { ...prevUser, isChecked: !prevUser.isChecked };
                      }
                      return prevUser;
                    });
                  });
                }}
              />
              <ProfileModal name={user.name} currUser={user.id} />
            </li>
          ))}
        </ul>
        {props.type !== "game_waiting" && (
          <div className="chat-member-button">
            <button onClick={goHome}>home</button>
            <button onClick={kick}>kick</button>
            <button onClick={givePermission}>oper</button>
            <button
              style={{ width: "70%", marginTop: "5%" }}
              onClick={() => {
                setChatConfigure("create");

                openModal();
              }}
            >
              채팅방 생성
            </button>
            <button
              style={{ width: "70%", marginTop: "5%" }}
              onClick={() => {
                setChatConfigure("setting");
                openModal();
              }}
            >
              채팅방 설정
            </button>
          </div>
        )}
        {isModalOpen && (
          <div className="chat-set-modal">
            <Modal
              closeModal={closeModal}
              ConfigureModal={() =>
                chatConfigure === "setting" ? (
                  <SettingChat closeModal={closeModal} />
                ) : (
                  <CreateChat
                    entryChannel={initMessages}
                    closeModal={closeModal}
                  />
                )
              }
            />
          </div>
        )}
      </div>
    </>
  );
}

const MemoChat = React.memo(Chat);

export default MemoChat;
