import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import Modal from "./Modal";
import "../css/ChannelList.css";
import { useSocket } from "../component/SocketContext";
import { whoami } from "../utils/whoami";

interface IChannel {
  channelname: string;
  host?: number | null;
  operator: number[];
  users: number[];
  member: number;
  maxmember: number;
  option: string;
  password?: string | null;
}

function ChannelsList(props: { channelList: IChannel[] }) {
  const [channelList, setChannelList] = useState<IChannel[]>([]);
  const [currChannel, setCurrChannel] = useState<number | null>(null);
  const socket = useSocket();
  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setChannelList([]);

    for (let i = 1; i < props.channelList.length; i++) {
      if (props.channelList[i].option !== "private") {
        addChannelList(props.channelList[i]);
      }
    }
  }, [props.channelList]);

  const joinChannel = async (password: string, index: number) => {
    const data = await whoami();
    if (socket)
      socket.emit("join", {
        id: data.id,
        channelname: channelList[index].channelname,
        password: password,
      });
    closeModal();
  };

  function addChannelList(channel: IChannel) {
    setChannelList((prevChannelList) => [...prevChannelList, channel]);
  }

  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = (index: number): void => {
    setModalOpen(true);
    setCurrChannel(index);
  };

  const renderOption = (index: number) => {
    if (channelList[index].option === "public") return <>🔓</>;
    else return <>🔐</>;
  };

  const closeModal = (): void => {
    setModalOpen(false);
  };

  function ChannelConfigure() {
    const [isPasswordDisplay, setPasswordDisplay] = useState(false);



    useEffect(() => {
      if (currChannel !== null && channelList[currChannel]?.option === "protected") {
        setPasswordDisplay(true);
      }
    }, [currChannel, channelList]);

    if (currChannel === null || !channelList[currChannel])
      return ;

    return (
      <>
        <div className="channel-access" style={{ padding: "10px" }}>
          <h1 style={{ fontSize: "20px" }}>
            {currChannel !== null && channelList[currChannel].channelname + " 의 채널"}
          </h1>
          <h1>방 설정</h1>
          <div>{currChannel !== null && channelList[currChannel].option}</div>
          <div>
            {currChannel !== null && channelList[currChannel].member} /{" "}
            {currChannel !== null && channelList[currChannel].maxmember}
          </div>
          {isPasswordDisplay && (
            <h1 style={{ padding: "10px" }}>
              password
              <input ref={passwordRef} style={{ margin: "10px" }}></input>
            </h1>
          )}
          <button
            className="join-button"
            onClick={() => {
              if (currChannel !== null) {
                let password:string;
                if (!passwordRef.current)
                  password = "";
                else
                  password = passwordRef.current.value;
                joinChannel(password, currChannel);
              }
            }}
          >
            join
          </button>
        </div>
      </>
    );
  }

  const searchText = useRef<HTMLInputElement | null>(null);

  function searchChannel() {
    if (searchText.current !== null) {
      const searchChannelName = searchText.current.value;
      for (let i = 0; i < channelList.length; i++) {
        if (searchChannelName === channelList[i].channelname) {
          openModal(i);
          searchText.current.value = "";
          return;
        }
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13 && event.key === "Enter") {
      searchChannel();
    }
  };

  return (
    <div className="channel-list">
      {channelList.map((channel, index) => (
        <li key={"channelList" + index}>
          <a className="chat_btn" onClick={() => openModal(index)}>
            {renderOption(index)}
            <div>{channel.channelname}'s channel</div>
            <div className="chat_memeber_count">
              {channel.member} / {channel.maxmember}
            </div>
          </a>
        </li>
      ))}
      {isModalOpen && (
        <Modal closeModal={closeModal} ConfigureModal={ChannelConfigure} />
      )}
      <div className="search-side">
        <input ref={searchText} onKeyDown={handleKeyDown} type="text"></input>
        <button className="search-button" onClick={searchChannel}>
          🔍
        </button>
      </div>
    </div>
  );
}

const MemoChannelsList = React.memo(ChannelsList);

export default  MemoChannelsList;