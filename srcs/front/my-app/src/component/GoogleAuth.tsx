

import React, { useState, useRef, ChangeEvent } from "react";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { postAuthenticate } from "../utils/ApiRequest";

export default function GoogleAuth() {
  const [otp, setOtp] = useState("");
  const [otp2, setOtp2] = useState("");
  const navigate = useNavigate();

  const handleOtpChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputOtp = event.target.value;
    setOtp(inputOtp);
  };

  const handleOtpChange2 = (event: ChangeEvent<HTMLInputElement>) => {
    const inputOtp = event.target.value;
    setOtp2(inputOtp);
  };

  const handleOtpClick = () => {
    const fullotp = otp + otp2;  
    postAuthenticate(fullotp)
      .then((response) => {
        console.log(response);
        if (response.data) navigate("/main");
      })
      .catch(() => {
        setOtp("");
        setOtp2("");
        toast.error("인증번호가 일치하지 않습니다.", {
          position: toast.POSITION.TOP_LEFT,
          style: {
            width: "500px",
            height: "100px",
            fontSize: "30px",
          },
          autoClose: 1500,
        });
      });
  };

  const firstOtpRef = useRef<HTMLInputElement | null>(null);
  const secondOtpRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleInput = () => {
    const maxLength = firstOtpRef.current?.maxLength || 0;
    const currentLength = otp.length;

    if (currentLength >= maxLength) {
      secondOtpRef.current?.focus();
    }
  };

  const handleInput2 = () => {
    const maxLength = secondOtpRef.current?.maxLength || 0;
    const currentLength = otp2.length;

    if (currentLength >= maxLength) {
      buttonRef.current?.focus();
    }
  };

  return (
    <div>
      <div style={{ fontSize: "20px", marginTop: "50px" }}>
        Google OTP (Google Authenticator) 인증번호
      </div>
      <input
        type="password"
        ref={firstOtpRef}
        maxLength={3}
        value={otp}
        onChange={handleOtpChange}
        onInput={handleInput}
        style={{
          textAlign: "center",
          marginTop: "30px",
          marginBottom: "30px",
          padding: "10px",
          fontSize: "50px",
          width: "120px",
          border: "1px solid #ccc",
        }}
      />
      <input
        type="password"
        ref={secondOtpRef}
        maxLength={3}
        value={otp2}
        onChange={handleOtpChange2}
        onInput={handleInput2}
        style={{
          textAlign: "center",
          marginLeft: "30px",
          marginTop: "30px",
          marginBottom: "30px",
          padding: "10px",
          fontSize: "50px",
          width: "120px",
          border: "1px solid #ccc",
        }}
      />
      <br></br>
      <button
        className="login"
        ref={buttonRef}
        onClick={handleOtpClick}
        style={{ width: "100px", height: "50px", fontSize: "20px" }}
      >
        인증하기
      </button>
      <ToastContainer />
    </div>
  );
}
