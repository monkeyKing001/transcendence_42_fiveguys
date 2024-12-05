import React, { createContext, useContext, useEffect, useState } from "react";
import { useCurPage } from "./CurPageContext";
import { io, Socket } from "socket.io-client";

import { getWhoami } from "../utils/ApiRequest";
interface ProviderProps {
  children: React.ReactNode;
}

const SocketContext = createContext<Socket | null>(null);
const GameSocketContext = createContext<Socket | null>(null);
const socketUrl: string = process.env.REACT_APP_SOCKET_URL;

export function GameSocketProvider({ children }: ProviderProps) {
  const gameSocket = useGameSocketConnection();

  return (
    <GameSocketContext.Provider value={gameSocket}>
      {children}
    </GameSocketContext.Provider>
  );
}

export function SocketProvider({ children }: ProviderProps) {
  const socket = useSocketConnection();

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useGameSocket() {
  return useContext(GameSocketContext);
}

export function useSocket() {
  return useContext(SocketContext);
}

function useGameSocketConnection() {
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const { match, set } = useCurPage();
  useEffect(() => {
    const newGameSocket = io(`${socketUrl}/game`, { withCredentials: true });

    newGameSocket.on("connectionBlock", () => {
      console.log("block");
      newGameSocket.disconnect();
      set("block");
    });
    setGameSocket(newGameSocket);

    return () => {
      newGameSocket.disconnect();
    };
  }, []);

  return gameSocket;
}

function useSocketConnection() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(`${socketUrl}/chat`, { withCredentials: true });

    const whoAmI = async () => {
     getWhoami()
        .then((resposne) => {
          const data = resposne.data;
          if (data) {
            newSocket.emit("bind", data.id, (resposne : number)=>{
              if (resposne === 1)
                setSocket(newSocket);
            });
            console.log("data", data.id);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };
    whoAmI();

    // newSocket.on("exit", () => {
    //   console.log("exit!!");
    // while (1) {
    //   alert("Already login user");
    //   navigate()
    // }
    // navigate("/");
    // });
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
}
