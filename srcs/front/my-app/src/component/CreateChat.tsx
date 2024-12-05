import { useState, ChangeEvent, MouseEvent } from "react";
import { useSocket } from "../component/SocketContext";
import { whoami } from "../utils/whoami";
import { where } from "../utils/where";
import { Socket } from "socket.io-client";
interface CreateChatProps {
  closeModal: () => void;
  entryChannel: () => void;
}

export default function CreateChat(props: CreateChatProps) {
  const socket :Socket | null = useSocket();
  const [isChecked, setChecked] = useState<string>("public");
  const [selectedValue, setSelectedValue] = useState<number>(10);
  const [password, setPassword] = useState<string>("");

  const passwordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const createChatSock = async () => {
    props.closeModal();
    try {
      const data = await whoami();
      where(socket, data.id)
        .then((channel) => {
          console.log(channel.channelname);
          if (channel.channelname === "$home") {
            if (socket)
            {
              socket.emit("create", {
                id: data.id,
                maxmember: selectedValue,
                option: isChecked,
                password: password,
              });
              props.entryChannel();
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div id="ChatSetting">
      <h1
        style={{
          fontSize: "30px",
          textAlign: "center",
          padding: "10px",
        }}
      >
        채팅방 생성
      </h1>
      <div className="container">
        <div className="form-container">
          <form>
            <label>
              <input
                type="radio"
                name="public"
                checked={isChecked === "public"}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setChecked(e.target.name);
                }}
              ></input>
              <span>PUBLIC</span>
            </label>
            <label>
              <input
                type="radio"
                name="protected"
                checked={isChecked === "protected"}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setChecked(e.target.name);
                }}
              ></input>
              <span>PROTECTED</span>
            </label>
            <label>
              <input
                type="radio"
                name="private"
                checked={isChecked === "private"}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setChecked(e.target.name);
                }}
              ></input>
              <span>PRIVATE</span>
            </label>
          </form>
          <div className="chat-set-right">
            <div className="max-People" style={{ padding: "10px" }}>
              최대 수용 인원
              <select
                style={{ marginLeft: "10px" }}
                name="max-people"
                className="select"
                value={selectedValue}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setSelectedValue(parseInt(e.target.value, 10))
                }
              >
                {Array(24)
                  .fill(0)
                  .map((_, i) => (
                    <option key={i} value={i + 2}>
                      {i + 2}
                    </option>
                  ))}
              </select>
            </div>
            {isChecked === "protected" && (
              <div style={{ padding: "10px" }}>
                password
                <input
                  onChange={passwordChange}
                  type="text"
                  style={{ marginLeft: "10px" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={createChatSock} className="setting-button">
        생성
      </button>
    </div>
  );
}
