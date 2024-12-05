import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { SocketProvider, GameSocketProvider } from "./component/SocketContext";
import { CurPageProvider } from "./component/CurPageContext";
import LoginPage from "./page/LoginPage";
import MainPage from "./page/MainPage";
import CreateAccPage from "./page/CreateAccPage";
import Callback from "./page/CallbackPage";
import FullTFA from "./page/FullTFA";
import GamePage from "./page/GamePage";
import PartialTFA from "./page/PartialTFA";
import NotFound from "./page/Notfound";
import { getWhoami } from "./utils/ApiRequest";
import { useEffect, useRef } from "react";

function App() {
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [isSet, setIsSet] = useState<boolean>(false);

  const [isOn, setIsOn] = useState<boolean>(false);
  const checkOnRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    function checkOn(setIsSet : React.Dispatch<React.SetStateAction<boolean>>, setIsLogin: React.Dispatch<React.SetStateAction<boolean>>, setIsOn: React.Dispatch<React.SetStateAction<boolean>>) {
      getWhoami()
        .then((result) => {
          if (result.data.status === 0) {
            setIsOn(true);
            console.log("whoami");
          }
          setIsLogin(true);
          setIsSet(true);
        })
        .catch((err) => {
          if (checkOnRef.current)
            clearInterval(checkOnRef.current);
          setIsSet(true);
          setIsLogin(false);
        });
    }
    checkOn(setIsSet, setIsLogin, setIsOn);
    checkOnRef.current = setInterval(() => {
      checkOn(setIsSet, setIsLogin, setIsOn);
    }, 500);
    return () => {
      if (checkOnRef.current) {
        clearInterval(checkOnRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (isOn === true) if (checkOnRef.current)clearInterval(checkOnRef.current);
  }, [isOn]);
  return (
    <CurPageProvider>
      <GameSocketProvider>
        <SocketProvider>
          <Router>
            {isSet && (
              <Routes>
                <Route path="/" Component={LoginPage}></Route>
                <Route
                  path="/main"
                  Component={!isOn ? LoginPage : isLogin ? MainPage : LoginPage}
                ></Route>
                <Route
                  path="/create-account"
                  Component={
                    !isOn ? LoginPage : isLogin ? CreateAccPage : LoginPage
                  }
                ></Route>
                <Route
                  path="/callback"
                  Component={!isOn ? LoginPage : isLogin ? Callback : LoginPage}
                ></Route>
                <Route
                  path="/game"
                  Component={!isOn ? LoginPage : isLogin ? GamePage : LoginPage}
                ></Route>
                <Route
                  path="/full-tfa"
                  Component={!isOn ? LoginPage : isLogin ? FullTFA : LoginPage}
                ></Route>
                <Route
                  path="/partial-tfa"
                  Component={
                     PartialTFA 
                  }
                ></Route>
                <Route path="*" Component={NotFound} />
              </Routes>
            )}
          </Router>
        </SocketProvider>
      </GameSocketProvider>
    </CurPageProvider>
  );
}

export default App;
