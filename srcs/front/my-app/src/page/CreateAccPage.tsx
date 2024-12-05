import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CreateAccPage.css";
import { Buffer } from "buffer";
import {
  modifyNickname,
  getUserByNickname,
  getWhoami,
  modifyAvatar,
  modifyFirstCreateFlag,
} from "../utils/ApiRequest";
import { useRef } from "react";

export default function CreateAccPage() {
  const nickname = useRef<HTMLInputElement | null>(null);
  const [avatar, setAvatar] = useState("");
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const image = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getWhoami()
      .then((result) => {
        const bufferData: number[] = result.data.profilePicture.data;
        const buffer: Buffer = Buffer.from(bufferData);
        setAvatar(buffer.toString("base64"));
        if (nickname.current)
          nickname.current.value = result.data.nickname;
      })
      .catch((err) => {});
  }, []);

  const createAccount = () => {
    if (nickname.current)
    {
    if (!nickname.current.value) {
      alert("닉네임이 입력되지 않았습니다.");
      return;
    }
    if (nickname.current.value.search(/[^a-zA-Z0-9!@#$]/g) > -1) {
      alert("닉네임은 영문과 숫자만 가능합니다!!");
      return;
    }
    getUserByNickname(nickname.current.value)
      .then((result) => {
        alert("이미 존재하는 닉네임입니다.");
      })
      .catch((err) => {
        console.log("catcch in");
        if (nickname.current)
        modifyNickname(nickname.current.value, false)
        .then((result) => {
            console.log("modifyNickname");
            modifyAvatar(selectedFile)
            .then((response) => {
                console.log("modifyAvatar");
                modifyFirstCreateFlag();
                navigate("/main");
              })
              .catch((err) => {
                console.log("modifyAvatar");
                modifyFirstCreateFlag();
                navigate("/main");
              });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileSizeKB = files[0].size / 1024;
      console.log(fileSizeKB);
      if (fileSizeKB > 6000) {
        // 100KB를 초과하면
        alert("첨부 파일 크기가 허용 제한을 초과했습니다.");
		if (image.current)
        	image.current.value = "";
        return;
      }
      const selectedFile = files[0];
      setSelectedFile(selectedFile);

      const reader = new FileReader();
      reader.onload = function (event) {
        const result = event.target?.result;
        if (typeof result === "string") {
          console.log("setAvatar");
          setAvatar(result.split(",")[1]);
          if (image.current)
            image.current.value = "";
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="background .my-profile-container">
      <div className="avatar-button-div">
        <div className="account-box">
          <div>
            설정을 하지 않거나 이탈할 경우 기본 닉네임과 아바타로 설정됩니다.
          </div>
          <div>
            닉네임
            <input
              ref={nickname}
              type="text"
              maxLength={13}
              placeholder={"nickname"}
            ></input>
          </div>
          <div
            className="avatar-wrapper"
            style={{
              textAlign: "center",
              alignItems: "center",
              justifyContent: "center",
              transform: "translate(60%)",
            }}
          >
            <img
              src={`data:image/jpeg;base64,${avatar}`}
              alt="avatar"
              className="avatar-img"
            ></img>
          </div>
          <div>
            아바타
            <input
              className="avatar-file"
              type="file"
              accept=".jpg, .jpeg, .png"
              onChange={handleFileChange} // 여기를 추가했습니다.
              ref={image}
            ></input>
          </div>
          <button onClick={createAccount}>계정 생성</button>
        </div>
      </div>
    </div>
  );
}
