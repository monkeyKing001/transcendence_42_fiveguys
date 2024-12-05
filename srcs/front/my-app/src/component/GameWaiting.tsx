import React, { useRef, useState, useEffect } from "react";
import { useSocket, useGameSocket } from "./SocketContext";
import "../css/GameWaiting.css";
import { useNavigate } from "react-router-dom";
import "../css/GamePage.css";
import { ballItem, padItem, htmlItem, game } from "../utils/Game.Class";
import { Socket } from "socket.io-client";
let tmp = -1;

export default function GameWaiting(prop: {
  type: boolean;
  leavefun: () => void;
}) {
  const [exit, setExit] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const obsRef = useRef<HTMLDivElement>(null);
  const padRef1 = useRef<HTMLDivElement>(null);
  const padRef2 = useRef<HTMLDivElement>(null);
  const socket: Socket | null = useGameSocket();
  const chatSocket: Socket | null = useSocket();
  const navigate = useNavigate();
  const [Ready, setReady] = useState<boolean>(false);
  const [State, setState] = useState<boolean>(false);
  const [MapNum, setMapNum] = useState<number>(1);
  const [BallNum, setBallNum] = useState<number>(2);
  const [SpeedNum, setSpeedNum] = useState<number>(2);
  const [myinfo, setMyInfo] = useState<string>("");
  const [other, setOther] = useState<string>("");
  const [PadNum, setPadNum] = useState<number>(2);
  const [client, setclient] = useState<number>(-1);
  const gameset = new game([], 0, 0, new ballItem(0, 0, 0, 0, 0, 0), []);
  const pad: padItem[] = [];
  const obstacle: htmlItem[] = [];
  const ball = new ballItem(0, 0, 0, 0, 0, 0);
  let board_x: number;
  let board_y: number;
  let ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  let v: number = 6;
  let r: number = 12;

  function draw() {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, board_x, board_y);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = pad[0].color;
      ctx.roundRect(
        pad[0].x,
        pad[0].y,
        pad[0].width,
        pad[0].height,
        pad[0].radi
      );
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = pad[1].color;
      ctx.roundRect(
        pad[1].x,
        pad[1].y,
        pad[1].width,
        pad[1].height,
        pad[1].radi
      );
      ctx.fill();
      for (let i = 0; i < obstacle.length; i++) {
        ctx.fillStyle = "#5a1515";
        ctx.fillRect(
          obstacle[i].x,
          obstacle[i].y,
          obstacle[i].width,
          obstacle[i].height
        );
      }
      ctx.closePath();
    }
  }
  function updatedirection(ball: ballItem) {
    ball.dy = 0.5 * Math.random() + 0.5;
    ball.dx = 1;
    ball.dx *= Math.random() < 0.5 ? -1 : 1;
    ball.dy *= Math.random() < 0.5 ? -1 : 1;
  }

  function bounce() {
    if (ball.x + ball.r > board_x) {
      ball.dx *= -1;
      ball.x += ball.dx * ball.v;
      ball.temp = -1;
    } else if (ball.x - ball.r < 0) {
      ball.dx *= -1;
      ball.x += ball.dx * ball.v;
      ball.temp = -1;
    } else if (ball.y + ball.r > board_y || ball.y - ball.r < 0) {
      ball.dy *= -1;
      ball.y += ball.dy * ball.v;
      ball.temp = -1;
    }
  }
  function pong() {
    ball.x += ball.dx * ball.v;
    ball.y += ball.dy * ball.v;
    bounce();
    bounce_obstacle(obstacle);
    bounce_obstacle(pad);
    draw();
  }

  function bounce_obstacle(obs: htmlItem[]) {
    for (let i = 0; i < obs.length; i++) {
      if (ball.temp != i) {
        if (ball.x > obs[i].x && ball.x < obs[i].x + obs[i].width) {
          if (
            ball.y > obs[i].y - ball.r &&
            ball.y < obs[i].y + obs[i].height + ball.r
          ) {
            ball.dy *= -1;
            ball.y += ball.dy * ball.v;
            ball.temp = i;
          }
        } else if (ball.y > obs[i].y && ball.y < obs[i].y + obs[i].height) {
          if (
            ball.x > obs[i].x - ball.r &&
            ball.x < obs[i].x + obs[i].width + ball.r
          ) {
            ball.dx *= -1;
            ball.x += ball.dx * ball.v;
            ball.temp = i;
          }
        } else {
          if (
            Math.sqrt(
              (ball.x - obs[i].x) * (ball.x - obs[i].x) +
                (ball.y - obs[i].y) * (ball.y - obs[i].y)
            ) < ball.r
          ) {
            ball.dx *= -1;
            ball.x += ball.dx * ball.v;
            ball.temp = i;
          } else if (
            Math.sqrt(
              (ball.x - obs[i].x - obs[i].width) *
                (ball.x - obs[i].x - obs[i].width) +
                (ball.y - obs[i].y) * (ball.y - obs[i].y)
            ) < ball.r
          ) {
            ball.dx *= -1;
            ball.x += ball.dx * ball.v;
            ball.temp = i;
          } else if (
            Math.sqrt(
              (ball.x - obs[i].x) * (ball.x - obs[i].x) +
                (ball.y - obs[i].y - obs[i].height) *
                  (ball.y - obs[i].y - obs[i].height)
            ) < ball.r
          ) {
            ball.dx *= -1;
            ball.x += ball.dx * ball.v;
            ball.temp = i;
          } else if (
            Math.sqrt(
              (ball.x - obs[i].x - obs[i].width) *
                (ball.x - obs[i].x - obs[i].width) +
                (ball.y - obs[i].y - obs[i].height) * (ball.y - obs[i].y) -
                obs[i].height
            ) < ball.r
          ) {
            ball.dx *= -1;
            ball.x += ball.dx * ball.v;
            ball.temp = i;
          }
        }
      }
    }
  }
  const handleButtonClick = () => {
    if (State) {
      setReady(!Ready);
      const element = document.getElementById("check-box");
      if (element) {
        if (!Ready) element.style.backgroundColor = "rgb(77, 246, 100)";
        else element.style.backgroundColor = "";
      }
    }
  };
  function gameSettingbutton(
    list: string,
    num: number,
    set: React.Dispatch<React.SetStateAction<number>>
  ) {
    function gameSettingNum(num: number) {
      if (client === 0) {
        if (num === 5) set(1);
        else if (num === 0) set(4);
        else set(num);
      }
    }
    return (
      <div className="game-setting-button">
        <div className="key">{list}</div>
        <div className="value">
          <button
            className="arrow left"
            onClick={() => gameSettingNum(num - 1)}
          ></button>
          <div>{num}</div>
          <button
            className="arrow right"
            onClick={() => gameSettingNum(num + 1)}
          ></button>
        </div>
      </div>
    );
  }
  function init() {
    const canvas = canvasRef.current;
    if (canvas) ctxRef.current = canvas.getContext("2d");
    if (gameRef.current) {
      board_x = gameRef.current.clientWidth;
      board_y = gameRef.current.clientHeight;
    }
    ball.init(board_x / 2, board_y / 2, 1, 1, v, r, -1);
    if (padRef1.current)
      pad.push(
        new padItem(
          padRef1.current.offsetLeft,
          padRef1.current.offsetTop,
          padRef1.current.offsetWidth,
          padRef1.current.offsetHeight,
          "#d9d9d9",
          parseInt(
            window.getComputedStyle(padRef1.current).borderBottomLeftRadius
          )
        )
      );
    if (padRef2.current)
      pad.push(
        new padItem(
          padRef2.current.offsetLeft,
          padRef2.current.offsetTop,
          padRef2.current.offsetWidth,
          padRef2.current.offsetHeight,
          "#ffe500",
          parseInt(
            window.getComputedStyle(padRef2.current).borderBottomLeftRadius
          )
        )
      );
    if (canvas) {
      canvas.width = board_x;
      canvas.height = board_y;
    }
    let obstacles = obsRef.current;
    if (obstacles) {
      let obj: Element | null = obstacles.firstElementChild;
      while (obj != null) {
        if (obj instanceof HTMLElement) {
          obstacle.push(
            new htmlItem(
              obj.offsetLeft,
              obj.offsetTop,
              obj.clientWidth,
              obj.clientHeight
            )
          );
          obj = obj.nextElementSibling;
        }
      }
    }
    pad[0].height = 20 * (PadNum - 1) + 116;
    pad[1].height = 20 * (PadNum - 1) + 116;
    ball.v = 4 * (SpeedNum - 1) + 2;
    obstacle.splice(MapNum - 1, 4 - MapNum);
    ball.r = 5 * (BallNum - 1) + 7;
    if (client != -1) {
      gameset.intervalId = setInterval(() => {
        pong();
      }, 20);
    }
  }
  useEffect(() => {
    tmp = -1;
    return () => {
      console.log("return tmp = " + tmp);
      if (socket) {
        socket.off("leave");
        socket.off("setupReply");
        socket.off("client");
        socket.off("matching waiting");
        socket.off("matchInfo");
        socket.off("goodtogo");
        socket.off("allReady");
      }
    };
  }, []);
  useEffect(() => {
    if (socket && prop.type !== true) {
      socket.emit("match", "");
    }
    if (socket && prop.type === true) {
      socket.emit("amiHost", (response: number) => {
        if (response === 1) socket.emit("oneOnOneMade", "");
      });
    }
    return () => {
      console.log("tmp", tmp);
      if (tmp === -1 && socket) {
        socket.emit("matchQueueOut", "");
        socket.emit("gameRoomOut", "");
      }
      if (socket && chatSocket) {
        socket.emit("whoamiGateway", "", (response: number) => {
          chatSocket.emit("leavegame", "");
        });
      }
    };
  }, [socket, chatSocket]);

  useEffect(() => {
    if (exit === 1) {
      tmp = 1;
      setTimeout(() => {
        prop.leavefun();
      }, 1500);
    }
    if (exit === 2) {
      tmp = 2;
      setTimeout(() => {
        navigate("/game");
      }, 0);
    }

    return () => {
      console.log("exit4", exit);
    };
  }, [exit]);
  useEffect(() => {
    init();

    if (socket) {
      socket.emit("myInfo", "", (response: string) => {
        console.log(response.length);
        if (response.length > 5) {
          setMyInfo(response.substr(0, 5) + "...");
        } else setMyInfo(response);
      });

      socket.on("leave", () => {
        setExit(1);
      });
      socket.on("setupReply", (data) => {
        setBallNum(data.Ball);
        setPadNum(data.Pad);
        setSpeedNum(data.Speed);
        setMapNum(data.Map);
      });
      socket.on("matching waiting", (data) => {
        console.log(data);
      });
      socket.on("matchInfo", (data) => {
        socket.emit("amiHost", "", (response: number) => {
          setclient(response);
          if (response === 0) {
            console.log("gamechatroom");
            if (chatSocket)
              chatSocket.emit("gamechatroom", {
                host: data.host.id,
                target: data.guest.id,
              });
          }
        });
        setState(true);
        socket.emit("other", "", (response: string) => {
          if (response.length > 5) {
            setOther(response.substr(0, 5) + "...");
          } else setOther(response);
        });
        console.log("State", State);
      });
      socket.on("goodtogo", () => {
        setExit(2);
      });
      socket.on("allReady", () => {
        socket.emit("amiHost", "", (response: number) => {
          console.log(response);
          if (response === 0) {
            gameset.board_x = board_x * 2;
            gameset.board_y = board_y * 2;

            gameset.ball.isEqual(ball);
            console.log(obstacle);
            for (let i = 0; i < obstacle.length; i++) {
              console.log(obstacle[i]);
              gameset.obs.push(
                new htmlItem(
                  obstacle[i].x,
                  obstacle[i].y,
                  obstacle[i].width,
                  obstacle[i].height
                )
              );
            }
            for (let i = 0; i < pad.length; i++) {
              gameset.pad.push(
                new padItem(
                  pad[i].x,
                  pad[i].y,
                  pad[i].width,
                  pad[i].height,
                  pad[i].color,
                  pad[i].radi
                )
              );
            }
            gameset.ball.r *= 1.6;
            for (let i = 0; i < gameset.obs.length; i++) {
              gameset.obs[i].height *= 2;
              gameset.obs[i].width *= 2;
              gameset.obs[i].x *= 2;
              gameset.obs[i].y *= 2;
            }
            for (let i = 0; i < 2; i++) {
              gameset.pad[i].x *= 2;
              gameset.pad[i].y *= 2;
              gameset.pad[i].height *= 2;
              gameset.pad[i].width *= 2;
            }
            socket.emit("gameSetting", gameset);
          }
        });
      });
      socket.emit("setUp", {
        Pad: PadNum,
        Speed: SpeedNum,
        Ball: BallNum,
        Map: MapNum,
      });
    }
    return () => {
      if (socket) {
        socket.off("setupReply");
        socket.off("client");
        socket.off("matching waiting");
        socket.off("matchInfo");
        socket.off("goodtogo");
        socket.off("allReady");
        socket.off("leave");
      }
      clearInterval(gameset.intervalId);
    };
  }, [PadNum, SpeedNum, BallNum, MapNum, client, socket, chatSocket]);

  useEffect(() => {
    console.log(State, Ready);
    if (Ready && State && socket) socket.emit("ready", Ready);
    else if (!Ready && State && socket) socket.emit("unReady", Ready);
  }, [Ready, State]);
  return (
    <div className="game-waiting-container">
      <div className="player">
        <div>{myinfo}</div>
        <div>vs</div>
        {!State && (
          <div>
            <div className="btn-loading btn-square">
              <span className="loading loading-spinner"></span>
            </div>
          </div>
        )}
        {State && <div>{other}</div>}
      </div>
      <div className="game-setting">
        <div className="mini-map" ref={gameRef}>
          <canvas id="canvas" ref={canvasRef} />
          <div className="pad1" ref={padRef1}></div>
          <div className="pad2" ref={padRef2}></div>
          <div className="obstacle" ref={obsRef}>
            <div id="obstacle1"></div>
            <div id="obstacle2"></div>
            <div id="obstacle3"></div>
          </div>
        </div>
        <div className="game-setting-list">
          {gameSettingbutton("맵", MapNum, setMapNum)}
          {gameSettingbutton("공 크기", BallNum, setBallNum)}
          {gameSettingbutton("공 속도", SpeedNum, setSpeedNum)}
          {gameSettingbutton("pad 크기", PadNum, setPadNum)}
        </div>
      </div>
      <div className="ready-button">
        <div id="check-box"></div>
        <button
          className="btn-ready btn-outline btn-success"
          onClick={handleButtonClick}
        >
          READY
        </button>
        <button
          className="btn-leave btn-outline btn-error"
          onClick={prop.leavefun}
        >
          LEAVE
        </button>
      </div>
    </div>
  );
}
