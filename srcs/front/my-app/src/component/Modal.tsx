import { useContext, useEffect } from "react";
import "../css/Modal.css";
import { CurPageContext } from "./CurPageContext";

export default function Modal({
  closeModal,
  ConfigureModal,
  children,
}: {
  closeModal: () => void;
  ConfigureModal: () => JSX.Element | undefined;
  children?: JSX.Element | JSX.Element[];
}) {
  const { match, set } = useContext(CurPageContext);
  useEffect(()=>{
  if (match === "match" || match === "accept")
  {
    closeModal();
  }},[match]);


  const stopPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const close = (event: React.MouseEvent) => {
    event.stopPropagation();
    closeModal();
  };

  return (
    <>
      <div
        className="modal-overlay"
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          right: "0%",
          top: "0%",
          zIndex: "1000",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
        onClick={close}
      >
        <div className="profile-modal" onClick={stopPropagation}>
          {ConfigureModal()}
          <button className="close" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
