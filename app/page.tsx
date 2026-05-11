"use client";

import { useState } from "react";
import WelcomePage from "./components/WelcomePage";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {!showChat && <WelcomePage onEnter={() => setShowChat(true)} />}
      {/* Chat mounts early but stays hidden — avoids remount flash */}
      <div style={{
        opacity: showChat ? 1 : 0,
        pointerEvents: showChat ? "auto" : "none",
        transition: "opacity 0.5s ease",
      }}>
        <ChatInterface />
      </div>
    </>
  );
}