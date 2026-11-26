import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "./ScheduleManager.css";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ScheduleManager = () => {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);

//   const liveURl = "http://localhost:5000";
  const liveURl = "http://44.245.249.133:5000";
//   const liveURl = "192.168.29.151:5000";
  
   const [menuOpen, setMenuOpen] = useState(false);
    const fetchSchedule = async () => {
        try {
            const res = await axios.get(`${liveURl}/api/maintain/days/schedule`);
            setSchedule(
                res.data || {
                    barberId: "barber-001",
                    openingHours: {},
                    offDays: [],
                    accidentalLeaves: [],
                    specialClosures: [],
                }
            );
        } catch (err) {
            console.error("Error fetching schedule:", err);
            setSchedule({
                barberId: "barber-001",
                openingHours: {},
                offDays: [],
                accidentalLeaves: [],
                specialClosures: [],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const handleTimeChange = (day, field, value) => {
        setSchedule(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: {
                    ...prev.openingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const handleListChange = (field, values) => {
        setSchedule(prev => ({
            ...prev,
            [field]: values
        }));
    };

    const handleSave = async () => {
        try {
            await axios.post(`${liveURl}/api/maintain/days/schedule`, schedule);
            alert("✅ Schedule saved!");
        } catch (error) {
            console.error("Save failed", error);
            alert("❌ Failed to save schedule");
        }
    };

    if (loading) return <p>Loading...</p>;

    
    
     
    return (
        <>
            {/* Full Width Header */}
            {/* <div className="header-wrapper">
                <div className="queue-header align-header">
                    <img
                        src="/Jayesh_Barber_2.png"
                        alt="Barber Logo"
                        className="queue-logo"
                        href="/barber-queue"
                    />
                    <div className="nav-links">
                        <Link to="/barber-queue">Queue</Link>
                        <Link to="/manage-schedule" style={{color: '#008EFF'}}>Day's Management</Link>
                        <Link to="/manage-services">Services Management</Link>
              <Link to="/viewer-only">Up Next</Link>
                    </div>
                </div>
            </div> */}

            <div className="header-wrapper">
        <div className="queue-header align-header">
          <img src="/jaysh_barbershop_2.png" alt="Barber Logo" className="queue-logo" />

          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <div className={`nav-links ${menuOpen ? "show" : ""}`}>
            <a href="/barber-queue">Queue</a>
            <a href="/manage-schedule" style={{ color: '#008EFF' }}>Day's Management</a>
            <a href="/manage-services">Services Management</a>
            <a href="/viewer-only">Up Next</a>

            {/* Add Walk-In button inside menu for mobile */}

          </div>
        </div>
      </div>

            {/* Schedule Manager */}
            <div className="schedule-container">
                <h2>🗓️ Manage Your Shop Schedule</h2>

                <div className="schedule-grid">
                    {daysOfWeek.map(day => (
                        <div className="day-row" key={day}>
                            <strong>{day}</strong>
                            <TimePicker
                                onChange={(value) => handleTimeChange(day, "open", value)}
                                value={schedule.openingHours?.[day]?.open || ""}
                                disableClock
                                clearIcon={null}
                            />
                            <TimePicker
                                onChange={(value) => handleTimeChange(day, "close", value)}
                                value={schedule.openingHours?.[day]?.close || ""}
                                disableClock
                                clearIcon={null}
                            />
                        </div>
                    ))}
                </div>

                <div className="leave-section">
                    <label>🛑 Weekly Off Days (e.g., Sunday)</label>
                    <input
                        type="text"
                        placeholder="Comma separated (e.g. Sunday, Wednesday)"
                        value={schedule.offDays?.join(", ") || ""}
                        onChange={e =>
                            handleListChange("offDays", e.target.value.split(",").map(d => d.trim()).filter(Boolean))
                        }
                    />

                    <label>🚧 Accidental Leaves (yyyy-mm-dd)</label>
                    <input
                        type="text"
                        placeholder="Comma separated dates"
                        value={schedule.accidentalLeaves?.join(", ") || ""}
                        onChange={e =>
                            handleListChange("accidentalLeaves", e.target.value.split(",").map(d => d.trim()).filter(Boolean))
                        }
                    />

                    <label>🎉 Special Closures (Festivals etc.)</label>
                    <input
                        type="text"
                        placeholder="Comma separated"
                        value={schedule.specialClosures?.join(", ") || ""}
                        onChange={e =>
                            handleListChange("specialClosures", e.target.value.split(",").map(d => d.trim()).filter(Boolean))
                        }
                    />
                </div>

                <button onClick={handleSave} className="save-btn">💾 Save Schedule</button>
            </div>
        </>
    );
};

export default ScheduleManager;
