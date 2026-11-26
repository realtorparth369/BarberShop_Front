import React, { useState, useEffect } from "react";
import axios from "axios";
import "./WalkInBookingForm.css";

const WalkInBookingForm = ({ onSuccess }) => {
  const [step, setStep] = useState(0); // 0: main, 1: addons, 2: extras, 3: combos, 4: barber & submit
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState({ main: [], addons: [], extras: [], combos: [] });
  const [selectedServices, setSelectedServices] = useState([]);
  const [priority, setPriority] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  

  const liveURl = "http://localhost:5000";
  
  const [serviceSteps, setServiceSteps] = useState([]);


 useEffect(() => {
  const fetchServices = () => {
    axios.get(`${liveURl}/api/maintain/services/services`)
      .then((res) => {
        if (res.data && typeof res.data === "object") {
          setServices(res.data);

          const dynamicSteps = Object.keys(res.data).map((key) => ({
            key,
            title: key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
          }));

          setServiceSteps(dynamicSteps);
        } else {
          console.error("Unexpected response format:", res.data);
        }
      })
      .catch((err) => console.error("Service fetch error:", err));
  };

  // Initial fetch
  fetchServices();

  // Set interval to fetch every 2 minutes
  const interval = setInterval(fetchServices, 2000); // 120000 ms = 2 minutes

  // Clear interval on unmount
  return () => clearInterval(interval);
}, []);



  const handleServiceToggle = (service) => {
    const exists = selectedServices.find((s) => s.name === service.name);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.name !== service.name));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = async () => {
    // Trim input values
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    // const trimmedEmail = email.trim();

    // Name validation
    if (!trimmedName) {
      setStatusMsg("⚠️ Name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setStatusMsg("⚠️ Name must be at least 2 characters.");
      return;
    }
    
    const phoneRegex = /^[2-9]\d{9}$/;
    if (!trimmedPhone) {
      setStatusMsg("⚠️ Mobile number is required.");
      return;
    }
    if (!phoneRegex.test(trimmedPhone)) {
      setStatusMsg("⚠️ Please enter a valid 10-digit Cellphone Number.");
      return;
    }


    // Service selection check
    if (selectedServices.length === 0) {
      setStatusMsg("⚠️ Please select at least one service.");
      return;
    }

    // Submit
    try {
      const res = await axios.post(`${liveURl}/api/book/bookings/walk-in`, {
        name: trimmedName,
        phone: trimmedPhone,
        services: selectedServices,
        barber: "Jayesh",
        priority,
      });

      if (res.data.success) {
        setStatusMsg("✅ Walk-in booking added!");
        setName("");
        setPhone("");
        // setEmail("");
        setSelectedServices([]);
        setPriority(false);
        setStep(0);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Error:", err);
      setStatusMsg("❌ Failed to add walk-in booking.");
    }
  };

  const renderCurrentStep = () => {
    if (step < serviceSteps.length) {
      const current = serviceSteps[step];
      const list = services[current.key] || [];
      return (
        <div className="form-section">
          <h3>{current.title}</h3>
          {list.length === 0 && <p>Loading services...</p>}
          {list.map((service, i) => (
            <label key={i} className="service-checkbox">
              <input
                type="checkbox"
                checked={selectedServices.some((s) => s.name === service.name)}
                onChange={() => handleServiceToggle(service)}
              />
              {service.name} — ${service.price} ({service.duration} min)
            </label>
          ))}
        </div>
      );
    }

    // Final Step: Barber info and Submit
    return (
      <>
        <div className="form-section">
          <strong>💈 Barber</strong>
          <p className="default-barber">Jayesh (default)</p>
        </div>
        <button className="booking-button btn-green" onClick={handleSubmit}>
          ✅ Confirm Walk-in
        </button>
      </>
    );
  };

  return (
    <div className="walkin-form-container">
      <h2 className="form-title">➕ Add Walk-in Booking</h2>

      {/* User Info */}
      {step === 0 && (
        <>
          <input
            className="booking-input"
            type="text"
            placeholder="👤 Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="booking-input"
            type="text"
            placeholder="📱 Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </>
      )}

      {renderCurrentStep()}

      {/* Navigation Buttons */}
      <div className="step-buttons">
        {step > 0 && (
          <button className="booking-button btn-gray" onClick={() => setStep(step - 1)}>
            ⬅ Back
          </button>
        )}
        {step < serviceSteps.length && (
          <button className="booking-button btn-green" onClick={() => setStep(step + 1)}>
            Next ➡
          </button>
        )}
      </div>

      {statusMsg && <p className="status-msg">{statusMsg}</p>}
    </div>
  );
};

export default WalkInBookingForm;
