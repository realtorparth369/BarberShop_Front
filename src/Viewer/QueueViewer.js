// src/pages/QueueViewer.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./QueueViewer.css";


// "react-router-dom": "^7.7.1",

const QueueViewer = () => {
  const [queue, setQueue] = useState([]);
  const [countdowns, setCountdowns] = useState({}); // ✅ added

  // const liveURl = "http://localhost:5000";
  const liveURl = "http://44.245.249.133:5000";
  // const liveURl = "192.168.29.151:5000";

  // Fetch the current queue from DB every 3s
  useEffect(() => {
    
    const fetchQueue = async () => {
      try {
        const res = await axios.get(`${liveURl}/api/book/live-queue/getting`);
        if (res.data && Array.isArray(res.data.queue) && res.data.queue.length > 0) {
          setQueue(res.data.queue);
        }
        // else: do nothing, keep showing the last known queue
      } catch (err) {
        console.error("Failed to fetch queue", err);
      }
    };


    fetchQueue(); // initial
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  // ⏳ Calculate ETA/Countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedCountdowns = {};

      queue.forEach((customer, index) => {
        const start = new Date(customer.estimatedStart);
        const diff = start - now;

        if (index === 0) {
          const endTime = new Date(start.getTime() + customer.duration * 60000);
          const remaining = endTime - now;

          updatedCountdowns[customer._id] =
            remaining <= 0
              ? { status: "done", time: "00:00:00" }
              : {
                status: "current",
                time: msToTime(remaining),
              };
        } else if (diff <= 0) {
          updatedCountdowns[customer._id] = { status: "now", time: "NOW" };
        } else {
          updatedCountdowns[customer._id] = {
            status: "waiting",
            time: msToTime(diff),
          };
        }
      });

      setCountdowns(updatedCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [queue]);

  // ⏱ Helper to convert ms to HH:MM:SS
  // ⏱ Helper to convert ms to HH:MM
  // const msToTime = (ms) => {
  //   const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  //   const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  //   // return `${h}:${m}`;
  //   return `${h}H : ${m}M`;
  // };

const msToTime = (ms) => {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor((ms % 3600000) / 60000);
  let s = Math.floor((ms % 60000) / 1000);

  // If there are leftover seconds, bump minutes up
  if (s > 0) {
    m += 1;
    if (m === 60) {
      m = 0;
      h += 1;
    }
  }

  h = String(h).padStart(2, "0");
  m = String(m).padStart(2, "0");

  return `${h}H : ${m}M`;
};



  return (
    <div className="queue-viewer-container1">
      <h2>UP NEXT</h2>
      {queue.length === 0 ? (
        <p className="no-customers1">No customers in queue.</p>
      ) : (
        <div className="viewer-list1">
          {queue.map((customer, index) => {
            const status = countdowns[customer._id]?.status;
            const isCurrent = status === "current";

            return (
              <div
                className={`viewer-card1 ${isCurrent ? "current-customer" : ""}`}
                key={customer._id}
              >
                <div className="viewer-card-index1">#{index + 1}</div>

                <div className="viewer-card-name1">
                  {customer.userName}
                  {customer.isChild ? "'s child" : ""}
                </div>
                <div className="viewer-card-eta1">
                  Barber : {customer.barber}
                </div>

                <div className="viewer-card-eta1">
                  {status === "current" ? (
                    <span className="status-green1">
                      Current · ⏳ {countdowns[customer._id].time}
                    </span>
                  ) : status === "done" ? (
                    <span className="status-red1">Current · ⏳ 00:00:00</span>
                  ) : status === "now" ? (
                    <>
                      ETA: <span className="status-green1">NOW</span>
                    </>
                  ) : (
                    <>ETA: {countdowns[customer._id]?.time || "--:--:--"}</>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

  );
};

export default QueueViewer;
