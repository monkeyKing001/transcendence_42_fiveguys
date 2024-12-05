import { useEffect, useState, useRef, KeyboardEvent } from "react";
import Modal from "./Modal";
import Profile from "./Profile";
import MemoProfile from "../component/Profile";
import {
  getFriendList,
  getWhoami,
  getUserByNickname,
} from "../utils/ApiRequest";

type FriendMap = {
  nickname: string;
  id: number;
  status: number;
};

export default function FriendsList() {
  const [friendList, setFriendList] = useState<FriendMap[]>([]);
  const [id, setId] = useState(0);
  const [currUser, setCurrUser] = useState<number | null>(null);
  const searchText = useRef<HTMLInputElement | null>(null);

  function searchUser() {
    if (searchText.current) {
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
  }

  function init() {
    getWhoami().then((myid) => {
      getFriendList(myid.data.id).then((friends) => {
        const newFriendList = [...friendList];
        for (let i = 0; i < friends.data.length; i++) {
          newFriendList.push({
            nickname: friends.data[i].nickname,
            id: friends.data[i].id,
            status: friends.data[i].status,
          });
        }
        setFriendList(newFriendList);
      });
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

  useEffect(() => {
    init();
    const pollingInterval = setInterval(init, 2000);
    return () => {
      clearInterval(pollingInterval);
    };
  }, []);

  return (
    <div className="friend-list">
      {friendList.map((friend) => (
        <li key={"friendList" + friend.id}>
          <a className="chat_btn" onClick={() => openModal(friend.id)}>
            <div>{friend.status === 1 ? "🟢" : friend.status === 2 ? "🟡" : "🔴"}</div>
            <div>{friend.nickname}</div>
          </a>
        </li>
      ))}
      {isModalOpen && (
        <Modal
          closeModal={closeModal}
          ConfigureModal={() => <Profile currUser={id} isMe={false} />}
        />
      )}
      <div className="search-side">
        <input ref={searchText} onKeyDown={handleKeyDown} type="text"></input>
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
    </div>
  );
}
