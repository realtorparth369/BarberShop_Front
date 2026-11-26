import React, { useState, useEffect } from "react";
import axios from "axios";


// Example React component
const BarberControls = () => {
    const [status, setStatus] = useState(null);
  
    const fetchStatus = async () => {
      const res = await fetch("/api/barber/status");
      const data = await res.json();
      setStatus(data);
    };
  
    useEffect(() => { fetchStatus(); }, []);
  
    const startQueue = async () => {
      await fetch("/api/barber/start", { method: "POST" });
      fetchStatus();
    };
  
    const pauseQueue = async () => {
      await fetch("/api/barber/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: 30 }),
      });
      fetchStatus();
    };
  
    const resumeQueue = async () => {
      await fetch("/api/barber/resume", { method: "POST" });
      fetchStatus();
    };
  
    return (
      <div className="barber-controls">
        {!status?.isStarted ? (
          <button onClick={startQueue}>🟢 Start Queue</button>
        ) : status?.isPaused ? (
          <>
            <p>⏸️ Paused until: {new Date(status.pauseUntil).toLocaleTimeString()}</p>
            <button onClick={resumeQueue}>▶️ Resume</button>
          </>
        ) : (
          <button onClick={pauseQueue}>⏸️ Pause for 30 mins</button>
        )}
      </div>
    );
  };
  

export default BarberControls;