import { useState, ChangeEvent } from "react"; // 타입 추가
import { useSocket } from "../component/SocketContext";
import { whoami } from "../utils/whoami";

export default function SettingChat(props: { closeModal: () => void }) { // 타입 추가
    const socket = useSocket();
    const [isChecked, setChecked] = useState<string>("public"); // 타입 추가
    const [selectedValue, setSelectedValue] = useState<number>(10); // 타입 추가
    const [password, setPassword] = useState<string>(""); // 타입 추가

    const passwordChange = (event: ChangeEvent<HTMLInputElement>) => { // 타입 추가
      setPassword(event.target.value);
    };

    const modifyChatSock = async () => {
      props.closeModal();
      try {
        const data = await whoami();
        if (socket)
          socket.emit("modify", {
            id: data.id,
            maxmember: selectedValue,
            option: isChecked,
            password: password,
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
          채팅방 설정
        </h1>
        <div className="container">
          <div className="form-container">
            <form>
              <label>
                <input
                  type="radio"
                  name="public"
                  checked={isChecked === "public"}
                  onChange={(e) => {
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
                  onChange={(e) => {
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
                  onChange={(e) => {
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
                  onChange={(e) => setSelectedValue(parseInt(e.target.value, 10))}
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
        <button onClick={modifyChatSock} className="setting-button">
          수정
        </button>
      </div>
    );
}
