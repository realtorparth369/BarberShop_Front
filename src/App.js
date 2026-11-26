import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Booking from "./Booking";
import BarberQueue from "./BarberQueue"; // ⬅️ New page for barber queue
import ScheduleManager from "./Schedule/ScheduleManager";
import BarberServicesManager from "./Services/BarberServicesManager";
import QueueViewer from "./Viewer/QueueViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Booking />} />
        <Route path="/barber-queue" element={<BarberQueue />} />
        <Route path="/manage-schedule" element={<ScheduleManager />} />
        <Route path="/manage-services" element={<BarberServicesManager />} />
        <Route path="/viewer-only" element={<QueueViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
