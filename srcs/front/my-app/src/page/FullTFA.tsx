import React, { useEffect, useState } from "react";
import "../css/TwoFactoryAuth.css";
import OtpSet from "../component/OtpSet";
import GoogleAuth from "../component/GoogleAuth";
import { getWhoami } from "../utils/ApiRequest";

export default function FullTFA() {
  const [curPage, setCurPage] = useState("google_auth");
  useEffect(() => {
    getWhoami()
      .then((response) => {
        if (!response.data.twoFA)
          setCurPage("otp_set");
        else
          setCurPage("google_auth");
        console.log(response.data.twoFA);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const renderPage = () => {
    switch (curPage) {
      case "otp_set":
        return <OtpSet onChangePage={changePage} />;
      case "google_auth":
        return <GoogleAuth/>;
    }
  };
  const changePage = (nextPage:string) => {
    setCurPage(nextPage);
  };
  return (
    <div className="background">
      <div className="tfa">{renderPage()}</div>
    </div>
  );
}
