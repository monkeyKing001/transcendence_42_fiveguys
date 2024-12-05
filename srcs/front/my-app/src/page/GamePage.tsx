import { useRef, useEffect } from "react";
import "../css/GamePage.css";
import { useGameSocket } from '../component/SocketContext';
import { useNavigate } from "react-router-dom";
import { ballItem, padItem, htmlItem } from "../utils/Game.Class"

export default function GamePage() {
  const socket = useGameSocket();

  const navigate = useRef(useNavigate());

  function host_win() {
    const score_1 = document.getElementById("score_2");
    if (score_1) {
      let score :number = parseInt(score_1.innerText) + 1;
      score_1.innerText = score.toString();
    }
  }

  function guest_win() {
    const score_2 = document.getElementById("score_1");
    if (score_2) {
      let score :number = parseInt(score_2.innerText) + 1;
      score_2.innerText = score.toString();
    }
  }

  let ball = useRef<ballItem>(new ballItem(0,0,0,0,0,0));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<boolean>(false);
  let client = useRef<number>(-1);
  let pad = useRef<padItem[]>([]);
  let obstacle = useRef<htmlItem[]>([]);
  let board_x = useRef<number>(0);
  let board_y = useRef<number>(0);
  let ctx = useRef<CanvasRenderingContext2D | null>(null);
  let a = useRef<number>(20);
  let move_px = useRef<number>(2);

  function draw() :void {
    const ctxRef = ctx.current;
    const board_xRef = board_x.current;
    const board_yRef = board_y.current;
    if (ctxRef) {
      ctxRef.clearRect(0, 0, board_xRef, board_yRef);
      ctxRef.beginPath();
      ctxRef.arc(ball.current.x, ball.current.y, ball.current.r, 0, Math.PI * 2);
      ctxRef.fillStyle = "#ffffff";
      ctxRef.fill();
      ctxRef.beginPath();
      ctxRef.fillStyle = pad.current[0].color;
      ctxRef.roundRect(pad.current[0].x, pad.current[0].y, pad.current[0].width, pad.current[0].height, pad.current[0].radi);
      ctxRef.fill();
      ctxRef.beginPath();
      ctxRef.fillStyle = pad.current[1].color;
      ctxRef.roundRect(pad.current[1].x, pad.current[1].y, pad.current[1].width, pad.current[1].height, pad.current[1].radi);
      ctxRef.fill();
      for (let i = 0; i < obstacle.current.length; i++) {
        ctxRef.fillStyle = "#5a1515";
        ctxRef.fillRect(
          obstacle.current[i].x,
          obstacle.current[i].y,
          obstacle.current[i].width,
          obstacle.current[i].height
        );
      }
      ctxRef.closePath();
    }
  }

  useEffect(() => {
    const game = gameRef.current;
    const handlKeyup = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        a.current = 3;
      }
      if (e.key === "ArrowDown") {
        a.current = 3;
      }
    };
    if (document.getElementById("winner-box")) {
      document.getElementById("winner-box")!.hidden = true;
    }
    let canvas = canvasRef.current;
    if (canvas)
      ctx.current = canvas.getContext("2d");
    if (game) {
      game.addEventListener("keyup", handlKeyup);
    }
    return () => {
      if (game) {
        game.removeEventListener("keyup", handlKeyup);
      }
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    const handlKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        a.current += 1;
        pad.current[client.current].y -= move_px.current + Math.log(a.current) / Math.log(1.05);
        if (pad.current[client.current].y < 0) pad.current[client.current].y = 0;
        if (client.current === 0 && socket) socket.emit('pad1', pad.current[client.current]);
        else if (client.current === 1 && socket) socket.emit('pad2', pad.current[client.current]);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        a.current += 1;
        pad.current[client.current].y += move_px.current + Math.log(a.current) / Math.log(1.05);
        if (pad.current[client.current].y > board_y.current - pad.current[client.current].height) pad.current[client.current].y = board_y.current - pad.current[client.current].height;
        if (client.current === 0 && socket) socket.emit('pad1', pad.current[client.current]);
        else if (client.current === 1 && socket) socket.emit('pad2', pad.current[client.current]);
      }
    };
    if (socket) {
      if (socket.connected === false)
        navigate.current('/');

      socket.emit('inGame', "", (response : boolean) => {
        if (response === false) {navigate.current('/main');}
        else if (response === true) {
          socket.on("Win", (data) => {
            console.log("asd");
            const winnerBox = document.getElementById("winner-box");
            returnRef.current = true;
            if (winnerBox) {
              winnerBox.hidden = false;
              winnerBox.querySelector("p")!.innerText = data.nickname + "가 이겼습니다";
            }
          });
          socket.on('count', data => {
            console.log("data", data);
            let count = document.getElementById("count");
            if (count) {
              if (data === 0) {
                if (client.current === 0) {
                  socket.emit("gameStart", "");
                }
                count.hidden = true;
              }
              count.innerText = data.toString();
            }
          });
          socket.on('hostScore', (data) => {
            host_win();
            ball.current.isEqual(data);
          });
          socket.on('guestScore', (data) => {
            guest_win();
            ball.current.isEqual(data);
          })
          ball.current.x = board_x.current / 2;
          ball.current.y = board_y.current / 2;
          socket.on('ball', (data) => {
            ball.current.dx = data.dx;
            ball.current.dy = data.dy;
          });
          socket.on('gameSetting', data => {
            console.log("setting", data);
            for (let i = 0; i < data.pad.length; i++) {
              pad.current.push(new padItem(data.pad[i].x,
                data.pad[i].y,
                data.pad[i].width,
                data.pad[i].height,
                data.pad[i].color,
                data.pad[i].radi)
              );
            }
            ball.current.isEqual(data.ball);
            board_x.current = data.board_x;
            board_y.current = data.board_y;
            if (canvasRef.current) {
              canvasRef.current.width = data.board_x;
              canvasRef.current.height = data.board_y;
            }
            for (let i = 0; i < data.obs.length; i++) {
              obstacle.current.push(
                new htmlItem(
                  data.obs[i].x,
                  data.obs[i].y,
                  data.obs[i].width,
                  data.obs[i].height
                )
              );
            }
            socket.on('pad1', (data) => {
              pad.current[0].isEqual(data);
            });
            socket.on('pad2', (data) => {
              pad.current[1].isEqual(data);
            });
            socket.on('draw', data => {
              ball.current.isEqual(data);
              draw();
            });
          });

          socket.emit("amiHost", "", (response : number) => {
            client.current = response;
            if (client.current === 0) {
              socket.emit("wait", "");
            }
            socket.emit('myInfo', "", (response: string) => {
              if (client.current === 0) {
                const p1 = document.getElementById("user2");
                if (p1) {
                  if (response.length > 5) {
                    p1.innerText = (response.substr(0, 5) + "...");
                  } else {
                    p1.innerText = response;
                  }
                }
                socket.emit('other', "", (response: string) => {
                  if (response.length > 5) {
                    document.getElementById("user1")!.innerText = (response.substr(0, 5) + "...");
                  } else {
                    document.getElementById("user1")!.innerText = response;
                  }
                });
              } else {
                const p2 = document.getElementById("user1");
                if (p2) {
                  if (response.length > 5) {
                    p2.innerText = (response.substr(0, 5) + "...");
                  } else {
                    p2.innerText = response;
                  }
                }
                socket.emit('other', "", (response: string) => {
                  if (response.length > 5) {
                    document.getElementById("user2")!.innerText = (response.substr(0, 5) + "...");
                  } else {
                    document.getElementById("user2")!.innerText = response;
                  }
                });
              }
            });
          });
        }
      });
    }

    if (gameRef.current) {
      gameRef.current.addEventListener("keydown", handlKeyDown);
    }

    return () => {
      if (game) {
        game.removeEventListener("keydown", handlKeyDown);
      }
      if (socket)
      {
        if (returnRef)
        {
          console.log("return");
          socket.emit('gameRoomOut', "");
        }
        socket.off('hostScore');
        socket.off('gameset');
        socket.off("Win");
        socket.off('guestScore');
        socket.off('pad1');
        socket.off('ball');
        socket.off('draw');
        socket.off('pad2');
        socket.off('count');
      }
    };
  }, [socket]);

  return (
    <div className="background">
      <div className="pong">
        <button id="winner-box" onClick={() => navigate.current('/main')}>
          <h2>게임 종료</h2>
          <p>가 이겼습니다!</p>
        </button>
        <div className="info">
          <div id="user1" className="user1"></div>
          <div id="p1" className="p1">
            <div id="score_1">0</div>
          </div>
          <div id="p2" className="p2">
            <div id="score_2">0</div>
          </div>
          <div id="user2" className="user2"></div>
        </div>
        <div className="gameset" ref={gameRef} tabIndex={0}>
          <div id="count">3
          <div  style={{ fontSize:"50px" }}>위로 이동 위쪽 화살표↑</div>
          <div style={{ fontSize:"50px" }}>아래로 이동 아래쪽 화살표↓</div>
          </div>
          <canvas id="canvas" ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}