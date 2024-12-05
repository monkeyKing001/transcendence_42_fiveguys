import React, { useState, KeyboardEvent, useEffect, useRef } from "react";

import "../css/MainPage.css";
import MemoProfile from "../component/Profile";
import GameWaiting from "../component/GameWaiting";
import LeaderBoard from "../component/LeaderBoard";
import FriendsList from "../component/FriendsList";
import MemoChannelsList from "../component/ChannelsList";
import MemoChat from "../component/Chat";
import { getWhoami, getUserByNickname } from "../utils/ApiRequest";
import Modal from "../component/Modal";

import { useSocket, useGameSocket } from "../component/SocketContext";
import { useCurPage } from "../component/CurPageContext";
import { Socket } from "socket.io-client";

export default function MainPage() {
  const [isMatch, setIsMatch] = useState(false);
  const [play, setPlay] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);
  const sideRef = useRef<HTMLInputElement | null>(null);
  const gameSocket = useGameSocket();
  const [curPage, setCurPage] = useState("my_profile");
  const [channelList, setChannelList] = useState([]);
  const [memberList, setMemberList] = useState([]);
  const socket : Socket | null = useSocket();
  const [myId, setMyId] = useState(0);

  const { match, set } = useCurPage();
  useEffect(() => {
    if (curPage !== "game_waiting") setPlay(false);
    set("");
  }, [curPage]);
  useEffect(() => {
    if (match === "block") {
      window.location.reload();
      if (socket)
        socket.disconnect();
    }
    if (match === "match") {
      if (sideRef.current) sideRef.current.checked = false;
      setIsMatch(true);
    }
    if (match === "accept") {
      if (sideRef.current) sideRef.current.checked = false;
      setIsMatch(false);
      setPlay(true);
      setCurPage("game_waiting");
    }
    if (match === "deny") {
      closeMatch();
      setPlay(false);
    }
    return () => {
      set("");
    };
  }, [match]);

  useEffect(() => {
    if (!socket) return;
    if (!gameSocket) return;
    socket.emit("moving", "");
    gameSocket.emit("checksocket", "", (response: number) => {
      if (response === 1)
        setTimeout(() => {
          console.log("checksocket");
          gameSocket.emit("checksocket", "", (response: number) => {
            if (response === 1) window.location.reload();
          });
        }, 1000);
    });

    gameSocket.on("OneOnOneNoti", (data) => {
      console.log("게임초대");
      set("match");
      setMatchInfo(data.id);
    });
    socket.on("allinfo", (data) => {
      getWhoami()
        .then((response) => {
          for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].users.length; j++) {
              if (data[i].users[j] === response.data.id) {
                if (JSON.stringify(data) !== JSON.stringify(channelList))
                  setChannelList(data);
                if (JSON.stringify(data[i].users) !== JSON.stringify(memberList))
                  setMemberList(data[i].users);
                return;
              }
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
    return () => {
      socket.off("exit");
      gameSocket.off("OneOnOneNoti");
      socket.off("allinfo");
    };
  }, [socket, gameSocket]);

  useEffect(() => {
    getWhoami().then((response) => {
      setMyId(response.data.id);
    });
    return () => {};
  }, []);

  const renderPage = () => {
    switch (curPage) {
      case "my_profile":
        return <MemoProfile currUser={myId} isMe={true} />;
      case "game_waiting":
        return <GameWaiting leavefun={leaveGameWaiting} type={play} />;
      case "leaderboard":
        return <LeaderBoard />;
    }
  };
  const [curSide, setCurSide] = useState("friends_list");
  const [friendsButtonClass, setFriendsButtonClass] =
    useState("clicked-button");
  const [channelsButtonClass, setChannelsButtonClass] =
    useState("default-button");
  const leaveGameWaiting = () => {
    setCurPage("my_profile");
  };

  const handleButtonClick = (side : string) => {
    if (side === "friends_list") {
      setCurSide("friends_list");
      setFriendsButtonClass("clicked-button");
      setChannelsButtonClass("default-button");
    } else if (side === "channels_list") {
      setCurSide("channels_list");
      setFriendsButtonClass("default-button");
      setChannelsButtonClass("clicked-button");
    }
  };
  const renderSide = () => {
    switch (curSide) {
      case "friends_list":
        return <FriendsList />;
      case "channels_list":
        return <MemoChannelsList channelList={channelList} />;
    }
  };

  const closeMatch = (): void => {
    setIsMatch(false);
    console.log("closeMatch");

    if (gameSocket && match !== "accept")
      if (gameSocket) gameSocket.emit("denyOneOnOne", "");
  };

  const [currUser, setCurrUser] = useState(null); // 현재 유저 상태
  const searchText = useRef<HTMLInputElement | null>(null);
  const [id, setId] = useState(0);

  function searchUser() {
    if (searchText.current)
    getUserByNickname(searchText.current.value)
      .then((result) => {
        if (result.data) {
          setModalOpen(true);
          setCurrUser(result.data.id);
        } else {
          alert("해당 유저가 없습니다");
        }
      })
      .catch((err) => {
        alert("해당 유저가 없습니다");
      });
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13 && event.key === "Enter") {
      searchUser();
    }
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = (id: number): void => {
    setId(id);
    setModalOpen(true);
  };
  const closeModal = (): void => {
    setModalOpen(false);
  };

  return (
    <div className="background">
      {matchInfo && isMatch && (
        <Modal
          closeModal={closeMatch}
          ConfigureModal={() => (
            <MemoProfile currUser={matchInfo} isMe={false} match={isMatch} />
          )}
        />
      )}
      <div className="drawer drawer-end">
        <input
          id="my-drawer-4"
          type="checkbox"
          className="drawer-toggle"
          ref={sideRef}
        />
        <div className="drawer-content">
          <section className="btn-container">
            <button
              className="btn btn-outline btn-success"
              onClick={() => {
                curPage !== "game_waiting" && setCurPage("game_waiting");
              }}
            >
              GAME START
            </button>
            <button
              className="btn btn-outline btn-warning"
              onClick={() => setCurPage("my_profile")}
            >
              MY PROFILE
            </button>
            <button
              className="btn btn-outline btn-error"
              onClick={() => setCurPage("leaderboard")}
            >
              LEADERBOARD
            </button>
          </section>
          <section className="chat-container">
            <MemoChat memberList={memberList} type={curPage} />
          </section>
          <section className="swap-container">{renderPage()}</section>
          <label
            htmlFor="my-drawer-4"
            className="drawer-button btn btn-primary"
            style={{ position: "fixed", right: "0" }}
          >
            COMM<br></br>◀︎
          </label>
        </div>
        <div className="drawer-side">
          <label htmlFor="my-drawer-4" className="drawer-overlay" />
          <div
            className="menu p-4 w-80 h-full bg-base-200 text-base-content"
            style={{ color: "#8a8a8a" }}
          >
            <div className="side-list">
              <div className="button-side">
                <button
                  className={friendsButtonClass}
                  onClick={() => handleButtonClick("friends_list")}
                >
                  FRIENDS
                </button>
                <button
                  className={channelsButtonClass}
                  onClick={() => handleButtonClick("channels_list")}
                >
                  CHANNELS
                </button>
              </div>
              <div className="list">{renderSide()}</div>
              {curSide === "friends_list" && (
                <div className="search-side">
                  <input
                    ref={searchText}
                    onKeyDown={handleKeyDown}
                    type="text"
                  ></input>
                  <button className="search-button" onClick={searchUser}>
                    🔍
                  </button>
                  {currUser && isModalOpen && (
                    <Modal
                      closeModal={closeModal}
                      ConfigureModal={() => (
                        <MemoProfile currUser={currUser} isMe={false} />
                      )}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
