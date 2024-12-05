import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLoginfortytwo } from "../utils/ApiRequest";

export default function CallbackPage() {
  const navigate = useNavigate();
  const [LoadingText, setLoadingText] = useState("Loading");

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (LoadingText.length === 10) setLoadingText("Loading");
      else setLoadingText((prevText) => prevText + ".");
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [LoadingText]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code: string | null = searchParams.get("code");
    if (code) loginCall(code);
  }, []);

  const loginCall = (code: string) => {
    const dataToSend = {
      code: code,
    };
    getLoginfortytwo()
      .then((response) => {
        if (response.data) navigate("/create-account");
      })
      .catch((error) => {
        if (error.response) {
          // 서버가 요청을 받았으나 응답 상태 코드가 실패인 경우
          console.error(error.response.data);
          console.error(error.response.status);
        } else if (error.request) {
          // 요청이 브라우저에 도달하지 않은 경우 (CORS 등의 이유)
          console.error(error.request);
        } else {
          // 기타 다른 오류
          console.error("Error", error.message);
        }
      });
  };

  return (
    <div className="background">
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#8a8a8a", fontSize: "150px" }}>{LoadingText}</div>
      </div>
    </div>
  );
}
