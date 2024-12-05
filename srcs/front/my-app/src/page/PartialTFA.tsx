import React, { useEffect, useState } from "react";
import "../css/TwoFactoryAuth.css";
import GoogleAuth from "../component/GoogleAuth";

export default function PartialTFA() {
  return (
    <div className="background">
      <div className="tfa">{<GoogleAuth />}</div>
    </div>
  );
}
