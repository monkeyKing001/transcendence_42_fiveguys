import "../css/LoginPage.css";
import { getWhoami, getRidi } from "../utils/ApiRequest";

import { useSocket } from "../component/SocketContext";
import { useEffect, useState } from "react";
import { useGameSocket } from "../component/SocketContext";
const serverUrl : string = process.env.REACT_APP_SERVER_URL;

const authUrl:string = process.env.REACT_APP_AUTH_URL;
function LoginPage() {
  const gameSocket = useGameSocket();
  const socket = useSocket();
  const [isLogin, setIsLogin] = useState(false);
  useEffect(() => {
    getWhoami()
      .then((result) => {
        if (result.data.status === 1) setIsLogin(true);
          // navigate("/main");
      })
      .catch((err) => {
        return;
      });
  }, []);
  useEffect(() => {
    if (socket) {
      if (isLogin === true) {
        if (gameSocket)
        {
          gameSocket.emit("checksocket","", (response : number) =>{
            if (response === 1)
              socket.disconnect();
            else
              window.location.reload();
          })
        }
        socket.disconnect();
      } 
    }
  }, [socket, isLogin, gameSocket]);
  const login42 = () => {
    getWhoami()
      .then((result) => {
        try{
          window.location.href = `${serverUrl}/auth/login`;
        }
        catch (error){
          console.log("#########      CATCH REDIRECT!!!     #$###$#$#$  ");
          //window.location.href = `${serverUrl}/auth/login`;
        }
      })
      .catch((err) => {
        try{
          window.location.href = `${serverUrl}/auth/login`;
        }
        catch (error){
          console.log("#########      CATCH REDIRECT!!!    #$###$#$#$  ");
          //window.location.href = `${serverUrl}/auth/login`;
        }
      });
  };
  return (
    <div className="hero min-h-screen bg-base-200">
      <button onClick={login42} className="login">
        LOGIN WITH 42
      </button>
      <div>해당 홈페이지는 PC와 태블릿에 최적화 되어 있습니다.</div>
    </div>
  );
}

export default LoginPage;
