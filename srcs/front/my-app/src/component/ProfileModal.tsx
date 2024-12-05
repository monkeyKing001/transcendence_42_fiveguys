import React, { useState } from "react";
import "../css/Modal.css";
import Modal from "./Modal";
import Profile from "./Profile";

type ProfileModalProps = {
  name: string;
  currUser: number;
};

export default function ProfileModal({ name, currUser }: ProfileModalProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = (): void => {
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
  };

  return (
    <div>
      <div onClick={openModal}>{name}</div>
      {isModalOpen && (
        <Modal
          closeModal={closeModal}
          ConfigureModal={() => <Profile currUser={currUser} isMe={false} />}
        />
      )}
    </div>
  );
}
