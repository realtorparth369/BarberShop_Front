import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";
import ReactModal from "react-modal";
import WalkInBookingForm from './WalkInBookingForm';
import "./BarberQueue.css";

const BarberQueue = () => {
  const [queue, setQueue] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [breakMenuOpen, setBreakMenuOpen] = useState(null); // customerId
  // const [selectedBreak, setSelectedBreak] = useState(5); // 5 or -5
  // const [addedBreaks, setAddedBreaks] = useState({}); // customerId -> total minutes added
  const [breakAdjustments, setBreakAdjustments] = useState({});
  const [appliedBreaks, setAppliedBreaks] = useState({});


  const liveURl = "http://localhost:5000";

  // ⬅️ Move this to the top of your component, before useEffect
  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${liveURl}/api/book/api/queue`);
      setQueue(res.data.queue || []);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  useEffect(() => {
    fetchQueue(); // initial fetch
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedCountdowns = {};

      queue.forEach((customer, index) => {
        const start = new Date(customer.estimatedStart);
        const diff = start - now;

        if (index === 0) {
          // First customer — current
          const endTime = new Date(start.getTime() + customer.duration * 60000);
          const remaining = endTime - now;

          if (remaining <= 0) {
            updatedCountdowns[customer._id] = {
              status: "done",
              time: "00:00:00",
            };
          } else {
            const hours = String(Math.floor(remaining / 3600000)).padStart(2, "0");
            const minutes = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
            const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

            updatedCountdowns[customer._id] = {
              status: "current",
              time: `${hours}:${minutes}:${seconds}`,
            };
          }
        } else if (diff <= 0) {
          // Already started, but not first
          updatedCountdowns[customer._id] = {
            status: "now",
            time: "NOW",
          };
        } else {
          // Still waiting
          const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
          const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
          const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

          updatedCountdowns[customer._id] = {
            status: "waiting",
            time: `${hours}:${minutes}:${seconds}`,
          };
        }
      });

      setCountdowns(updatedCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [queue]);


  // ✅ Handle Drag and Drop Reorder
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const reordered = [...queue];
    const [movedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, movedItem);

    setQueue(reordered); // Instant UI update

    const oldFirstId = queue[0]?._id;
    const newFirstId = reordered[0]?._id;
    const now = new Date();

    const body = {
      queue: reordered.map((item) => item._id),
    };

    // ✅ Only send remainingTimeMs if the first customer has changed
    if (newFirstId !== oldFirstId) {
      const start = new Date(reordered[0].estimatedStart);
      const end = new Date(start.getTime() + reordered[0].duration * 60000);
      const remainingTimeMs = Math.max(0, end - now);
      body.remainingTimeMs = remainingTimeMs;
    }

    try {
      await axios.post(`${liveURl}/api/book/queue/reorder`, body);
    } catch (err) {
      console.error("Failed to reorder queue", err);
    }
  };


  useEffect(() => {
    const interval = setInterval(() => {
      if (queue.length === 0) return;

      axios
        .post(`${liveURl}/api/book/live-queue/save`, {
          queue,
        })
        .catch((err) => console.error("Failed to sync live queue:", err));
    }, 1000); // every 5 seconds

    return () => clearInterval(interval);
  }, [queue]);


  const handleDeleteCustomer = async (e, customerId) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this booking permanently?")) return;

    try {
      const response = await axios.delete(`${liveURl}/api/book/bookings/${customerId}`);
      if (response.data.success) {
        await fetchQueue(); // ✅ re-fetch updated queue with corrected ETAs
      } else {
        alert("Failed to delete booking.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Server error while deleting booking.");
    }
  };


  const handleAddBreak = async (e, customerId, breakMinutes) => {
    if (e?.stopPropagation) e.stopPropagation(); // ✅ check if e exists

    try {
      await axios.post(`${liveURl}/api/book/queue/add-break`, {
        customerId,
        breakMinutes,
      });

      fetchQueue(); // refresh updated queue
    } catch (err) {
      console.error("Add break failed", err);
    }
  };

  const incrementBreak = (customerId) => {
    setBreakAdjustments((prev) => ({
      ...prev,
      [customerId]: (prev[customerId] || 0) + 5,
    }));
  };

  const decrementBreak = (customerId) => {
    const applied = appliedBreaks[customerId] || 0;
    const currentAdjust = breakAdjustments[customerId] || 0;

    // Prevent reducing below 0
    if (applied + currentAdjust <= 0) return;

    setBreakAdjustments((prev) => ({
      ...prev,
      [customerId]: currentAdjust - 5,
    }));
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      // If clicked outside any open break popup, close it
      if (!e.target.closest(".break-popup")) {
        setBreakMenuOpen(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);


  const applyBreak = async (customerId) => {
    const delta = breakAdjustments[customerId] || 0;
    if (delta === 0) return;

    try {
      await handleAddBreak(null, customerId, delta); // backend adjusts ETA

      // Update applied state
      setAppliedBreaks((prev) => ({
        ...prev,
        [customerId]: (prev[customerId] || 0) + delta,
      }));

      // Reset adjustment
      setBreakAdjustments((prev) => ({ ...prev, [customerId]: 0 }));

      // ✅ Close the popup
      setBreakMenuOpen(null);
    } catch (err) {
      console.error("Error applying break:", err);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);



  return (
    <div className="queue-container">
      <div className="queue-wrapper">
        {/* Header */}


        <div className="queue-header">
          {/* Mobile/Tablet Top Row */}
          <div className="top-row-header">
            <img
              src="/jaysh_barbershop_2.png"
              alt="Barber Logo"
              className="queue-logo"
            />

            {/* Hamburger icon - visible only on mobile */}
            <div className="hamburger" onClick={toggleMenu}>
              <div className="bar" />
              <div className="bar" />
              <div className="bar" />
            </div>
          </div>

          {/* Desktop view only: full header row */}
          <div className="desktop-header">
            <img
              src="/jaysh_barbershop_2.png"
              alt="Barber Logo"
              className="queue-logo desktop-logo"
            />

            <div className="nav-links desktop-nav">
              <a href="/barber-queue" style={{ color: '#008EFF' }}>Queue</a>
              <a href="/manage-schedule">Day's Management</a>
              <a href="/manage-services">Services Management</a>
              <a href="/viewer-only">Up Next</a>
            </div>

            <button onClick={() => setShowWalkInForm(true)} className="add-btn">
              ➕ Add Walk-In Customer
            </button>
          </div>

          {/* Mobile full screen menu */}
          {menuOpen && (
            <div className="mobile-nav">
              <a href="/barber-queue" onClick={toggleMenu}>Queue</a>
              <a href="/manage-schedule" onClick={toggleMenu}>Day's Management</a>
              <a href="/manage-services" onClick={toggleMenu}>Services Management</a>
              <a href="/viewer-only" onClick={toggleMenu}>Up Next</a>

              <button
                onClick={() => {
                  toggleMenu();
                  setShowWalkInForm(true);
                }}
                className="add-btn-mobile"
              >
                ➕ Add Walk-In Customer
              </button>
            </div>
          )}
        </div>





        {/* Queue List */}
        <h2 className="queue-title">🧔‍♂️ Barber Queue</h2>
        <DragDropContext onDragEnd={handleDragEnd}>

          {queue.length > 0 ? (
            <Droppable droppableId="queue">
              {(provided) => (
                <div
                  className="queue-list"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {queue.map((customer, index) => {
                    // const cardContent = (
//                       <div
//                         onClick={() => setSelectedCustomer(customer)}
//                         className="customer-card"
//                       >
                    const isCurrent = index === 0;

                    const cardContent = (
                      <div
                        onClick={() => setSelectedCustomer(customer)}
                        className={`customer-card ${isCurrent ? "current-customer" : ""}`}
                      >

                        <div>
                          <div className="card-index">#{index + 1}</div>
                          {/* <div className="card-name">{customer.userName}</div> */}
                          <div className="card-name">
                            {customer.userName}
                            {customer.isChild ? "'s child" : ""}
                          </div>

                          <div className="card-eta">
                            {countdowns[customer._id]?.status === "current" ? (
                              <span className="status-green">
                                Current · ⏳ {countdowns[customer._id].time}
                              </span>
                            ) : countdowns[customer._id]?.status === "done" ? (
                              <span className="status-red">
                                Current · ⏳ 00:00:00
                              </span>
                            ) : countdowns[customer._id]?.status === "now" ? (
                              <>ETA: <span className="status-green">NOW</span></>
                            ) : (
                              <>ETA: {countdowns[customer._id]?.time || "--:--:--"}</>
                            )}
                          </div>
                          <div className="card-triggerTime">{new Date(customer.estimatedStart).toLocaleString()}</div>
                        </div>

                        <div className="card-actions">
                          <button
                            onClick={(e) => handleDeleteCustomer(e, customer._id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>

                          <div className="break-wrapper">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBreakMenuOpen(
                                  breakMenuOpen === customer._id ? null : customer._id
                                );
                              }}
                              className="break-btn"
                            >
                              Add Break
                            </button>

                            {breakMenuOpen === customer._id && (
                              <div className="break-popup" onClick={(e) => e.stopPropagation()}>
                                <div className="break-controls">
                                  <button
                                    onClick={() => decrementBreak(customer._id)}
                                    disabled={(appliedBreaks[customer._id] || 0) + (breakAdjustments[customer._id] || 0) <= 0}
                                    className="minus-btn"
                                  >
                                    -5
                                  </button>
                                  <div className="break-time">
                                    {breakAdjustments[customer._id] || 0} min
                                  </div>
                                  <button
                                    onClick={() => incrementBreak(customer._id)}
                                    className="plus-btn"
                                  >
                                    +5
                                  </button>
                                </div>

                                <button
                                  onClick={() => applyBreak(customer._id)}
                                  className="apply-btn"
                                >
                                  Apply Break
                                </button>
                                <div className="break-total">
                                  Total: {(appliedBreaks[customer._id] || 0) + (breakAdjustments[customer._id] || 0)} min
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );

                    if (index === 0) return <div key={customer._id}>{cardContent}</div>;

                    return (
                      <Draggable key={customer._id} draggableId={customer._id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              background: snapshot.isDragging ? "#e6f9f0" : "transparent",
                            }}
                          >
                            {cardContent}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <p className="no-customers">No customers in queue.</p>
          )}
        </DragDropContext>

        {/* CUSTOMER MODAL */}
        <ReactModal
          isOpen={!!selectedCustomer}
          onRequestClose={() => setSelectedCustomer(null)}
          ariaHideApp={false}
          className="customer-modal"
          overlayClassName="modal-overlay"
        >
          {selectedCustomer && (
            <div>
              <h2 className="modal-title">👤 Customer Full Details</h2>
              <div className="details-grid">
                <div>
                  <strong>Customer Name:</strong>
                  <div>{selectedCustomer.userName}</div>
                </div>
                <div>
                  <strong>Customer ID:</strong>
                  <div>{selectedCustomer._id}</div>
                </div>
                <div>
                  <strong>Phone Number:</strong>
                  <div>{selectedCustomer.userPhone || "N/A"}</div>
                </div>
                <div>
                  <strong>Estimated Start:</strong>
                  <div>{new Date(selectedCustomer.estimatedStart).toLocaleString()}</div>
                </div>
                <div>
                  <strong>Duration:</strong>
                  <div>{selectedCustomer.duration} minutes</div>
                </div>
                <div>
                  <strong>Services:</strong>
                  {selectedCustomer.services?.length > 0 ? (
                    <ul>
                      {selectedCustomer.services.map((service, i) => (
                        <li key={i}>
                          <strong>{service.name}</strong> - ${service.price} · {service.duration} min
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No services found.</div>
                  )}
                </div>
                <div>
                  <strong>Status:</strong>
                  <div className="status-blue">
                    {countdowns[selectedCustomer._id]?.status?.toUpperCase() || "UNKNOWN"}
                  </div>
                </div>
                <div>
                  <strong>Remaining / ETA:</strong>
                  <div>{countdowns[selectedCustomer._id]?.time || "--:--:--"}</div>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setSelectedCustomer(null)} className="close-btn">Close</button>
                <button
                  onClick={(e) => handleDeleteCustomer(e, selectedCustomer._id)}
                  className="delete-btn"
                >
                  Delete This Customer
                </button>
              </div>
            </div>
          )}
        </ReactModal>

        {/* WALK-IN FORM MODAL */}
        <ReactModal
          isOpen={showWalkInForm}
          onRequestClose={() => setShowWalkInForm(false)}
          ariaHideApp={false}
          className="walkin-modal"
          overlayClassName="modal-overlay"
        >
          <WalkInBookingForm
            closeForm={() => setShowWalkInForm(false)}
            onSuccess={() => {
              setShowWalkInForm(false);
              fetchQueue();
            }}
          />
        </ReactModal>
      </div>
    </div>
  );

};

export default BarberQueue;