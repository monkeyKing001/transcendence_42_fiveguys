import React, { useEffect, useState } from "react";
import "../css/LeaderBoard.css";
import { getLeaderBoard } from "../utils/ApiRequest";

type LeaderBoardState = {
  nickname: string;
  gameLog: string;
  rate: string;
};

const styles: string[] = ["gold", "silver", "#af6114"];

export default function LeaderBoard() {
  const [leaderBoard, setLeaderBoard] = useState<LeaderBoardState[]>([]);
  useEffect(() => {
    getLeaderBoard()
      .then((result) => {
        let newLeaderBoard: LeaderBoardState[] = [];
        result.data.forEach((element: { nickname:string, wins:number, loses:number }) => {
          const nick: string = element.nickname;
          const gameLog: string = `${element.wins + element.loses}전 ${
            element.wins
          }승 ${element.loses}패`;
          const rate: string =
            "승률: " +
            (element.wins === 0
              ? "0%"
              : `${Math.floor(
                  (element.wins / (element.wins + element.loses)) * 100
                )}%`);
          const tmpLB: LeaderBoardState = {
            nickname: nick,
            gameLog: gameLog,
            rate: rate,
          };
          newLeaderBoard = [...newLeaderBoard, tmpLB];
        });
        setLeaderBoard(newLeaderBoard);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  return (
    <div className="leaderboard-container">
      <ul>
        {leaderBoard.map((data, index) => (
          <li className="ranklist" key={"leaderBoard " + index}>
            <div className="rank" style={{ color: styles[index] }}>
              {index + 1}
            </div>
            <div className="nickname">{data.nickname}</div>
            <div className="number">{data.gameLog}</div>
            <div className="ratio">{data.rate}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
