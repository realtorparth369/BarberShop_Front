import React, { useEffect, useState } from "react";
import './Booking.css';

// import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageSlider from "./ImageSlider";
import { FiClock } from "react-icons/fi";
import Footer from "./Footer/Footer";


const Booking = () => {
  const [step, setStep] = useState("phone"); // phone | register | service
  const [stepStage, setStepStage] = useState("services"); // services | barber | confirm | done | completed
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [phone, setPhone] = useState("");
  const [user, setUser] = useState(null);
  const [newUser, setNewUser] = useState({ phone: "", name: "" });

  const [services, setServices] = useState({});
  const [categoryKeys, setCategoryKeys] = useState([]);
  const [serviceStepIndex, setServiceStepIndex] = useState(0);
  const currentCategoryKey = categoryKeys[serviceStepIndex];

  const [selectedService, setSelectedService] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);
  const [estimatedStart, setEstimatedStart] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(0);
  const [allBookings, setAllBookings] = useState([]);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState(""); // ⚠️ In production, validate on backend
  const [isChildBooking, setIsChildBooking] = useState(false);
  const [returnToConfirmAfterEdit, setReturnToConfirmAfterEdit] = useState(false);

  // const liveURl = "http://localhost:5000";
  const liveURl = "http://44.245.249.133:5000";
  // const liveURl = "192.168.29.151:5000";


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setStep("service");

      fetch(`${liveURl}/api/book/bookings/latest/${parsed.phone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.booking) {
            setSelectedBarber(data.booking.barber);
            setSelectedService(data.booking.services);
            setEstimatedStart(data.booking.estimatedStart);
            setBookingDuration(data.booking.duration || 0);
            setStepStage("done");

            fetchUserBookings(); // ✅ Refresh list of bookings
            startLiveWaitCountdown(
              data.booking.estimatedStart,
              data.booking.duration || 0
            );
          }
        })
        .catch((err) => console.error("Error loading booking:", err));
    }
  }, []);


  useEffect(() => {
    if (step === "service") {
      fetch(`${liveURl}/api/maintain/services/services`)
        .then((res) => res.json())
        .then((data) => {
          setServices(data);
          setCategoryKeys(Object.keys(data)); // dynamically store order of categories
          setServiceStepIndex(0); // reset to first step
        })
        .catch((err) => console.error("Service fetch error:", err));
    }
  }, [step]);


  const checkPhone = async () => {
    const trimmedPhone = phone.trim();
    // const phoneRegex = /^[6-9]\d{9}$/;
    const phoneRegex = /^[2-9]\d{9}$/;


    if (!trimmedPhone) {
      alert("⚠️ Please enter your phone number.");
      return;
    }

    if (!phoneRegex.test(trimmedPhone)) {
      alert("⚠️ Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      const res = await fetch(`${liveURl}/api/auth/users/${trimmedPhone}`);
      const data = await res.json();

      if (data) {
        setServerOtp(data.otp); // Save the OTP (only for dev – in production, validate on backend)
        setOtpSent(true);       // Show OTP input field
        setPhone(trimmedPhone); // Save valid phone
        if (data.exists) {
          setUser(data.user);
          setStep("otp"); // Go to OTP step
        } else {
          setNewUser({ ...newUser, phone: trimmedPhone });
          setStep("register");
        }
      } else {
        alert("❌ Failed to fetch OTP.");
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      alert("❌ Something went wrong while checking phone.");
    }
  };


  const registerUser = async () => {
    const { phone, name } = newUser;
    // const { phone, name, email } = newUser;

    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();
    // const trimmedEmail = email.trim();

    // const phoneRegex = /^[6-9]\d{9}$/;
    const phoneRegex = /^[2-9]\d{9}$/;

    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedPhone || !trimmedName) {
      alert("⚠️ Please fill all required fields.");
      return;
    }
    // if (!trimmedPhone || !trimmedName || !trimmedEmail) {
    //   alert("⚠️ Please fill all required fields.");
    //   return;
    // }

    if (!phoneRegex.test(trimmedPhone)) {
      alert("⚠️ Invalid mobile number. Must be 10 digits.");
      return;
    }

    if (trimmedName.length < 2) {
      alert("⚠️ Name must be at least 2 characters.");
      return;
    }

    try {
      const res = await fetch(`${liveURl}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: trimmedPhone,
          name: trimmedName,
          // email: trimmedEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ ${data.error || "Registration failed."}`);
        return;
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userPhone", trimmedPhone);
      // setStep("service");
      setStep("otp"); // Go to OTP step
    } catch (error) {
      console.error("Error registering user:", error);
      alert("❌ Failed to register. Please try again.");
    }
  };


  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setSelectedService([]);
    setSelectedBarber(null);
    setStep("phone");
    setStepStage("services");
    setPhone("");
    setEstimatedStart(null);
    setEstimatedWait(null);
  };

  const formatTimeFromMilliseconds = (ms) => {
    const hrs = Math.floor(ms / (1000 * 60 * 60))
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
      .toString()
      .padStart(2, "0");
    const secs = Math.floor((ms % (1000 * 60)) / 1000)
      .toString()
      .padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const formatTimeFromMinutes = (minutes) => {
    if (minutes < 1) return "Less than a minute";
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs > 0 ? `${hrs} hr${hrs > 1 ? "s" : ""} ` : ""}${mins} min${mins !== 1 ? "s" : ""
      }`;
  };

  const startLiveWaitCountdown = (startTime, duration) => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000);
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(interval);
        setEstimatedWait("00:00:00");
        setStepStage("completed");
      } else {
        setEstimatedWait(formatTimeFromMilliseconds(diff));
      }
    }, 1000);
  };

  const fetchUserBookings = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user")); // 👈 safely get user
      const res = await fetch(`${liveURl}/api/book/bookings/user/${storedUser.phone}`);
      const data = await res.json();
      setUserBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching user bookings:", err);
    }
  };

  useEffect(() => {
    fetchUserBookings(); // initial fetch

    const interval = setInterval(fetchUserBookings, 3000); // repeat every 3 sec
    return () => clearInterval(interval); // cleanup on unmount
  }, []);


  const handleConfirmBooking = async () => {
    if (!user || !selectedService.length || !selectedBarber) {
      alert("Please select a service and barber");
      return;
    }

    try {
      const res = await fetch(`${liveURl}/api/book/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          services: selectedService,
          barber: selectedBarber,
          isChild: isChildBooking, // ✅ include child flag
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const waitMinutes = data.estimatedWaitMinutes || 0;
        const estStart = new Date(data.estimatedStart);
        const dur = data.booking.duration || 0;

        setEstimatedWait(formatTimeFromMinutes(waitMinutes));
        setEstimatedStart(estStart);
        setBookingDuration(dur);
        startLiveWaitCountdown(estStart, dur);
        setStepStage("done");
        setIsChildBooking(false); // ✅ reset child flag after booking
        fetchUserBookings(); // ✅ refresh bookings list
      } else {
        alert("Booking failed: " + data.error);
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("Something went wrong.");
    }
  };


  useEffect(() => {
    let intervalId;

    if (user && stepStage === "done") {
      const fetchUpdatedWaitTime = async () => {
        try {
          const res = await fetch(`${liveURl}/api/book/bookings/latest/${user.phone}`);
          const data = await res.json();

          if (data.booking && data.booking.estimatedStart) {
            const waitMinutes = data.booking.estimatedWaitMinutes || 0;
            const estStart = new Date(data.booking.estimatedStart);
            const dur = data.booking.duration || 0;

            setEstimatedStart(estStart);
            setBookingDuration(dur);
            setEstimatedWait(formatTimeFromMinutes(waitMinutes));
          }
        } catch (err) {
          console.error("Error polling wait time:", err);
        }
      };

      // Initial call
      fetchUpdatedWaitTime();
      // Poll every 3 seconds
      intervalId = setInterval(fetchUpdatedWaitTime, 3000);
    }

    return () => clearInterval(intervalId); // Clean up
  }, [user, stepStage]);



  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!estimatedStart) return;

    const startTime = new Date(estimatedStart).getTime(); // Convert to timestamp

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = startTime - now;

      if (remaining <= 0) {
        clearInterval(interval);
        setCountdown("NOW");
      } else {
        const totalSeconds = Math.floor(remaining / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");

        setCountdown(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedStart]);




  const [countdowns, setCountdowns] = useState({});
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedCountdowns = {};

      userBookings.forEach((booking) => {
        const startTime = new Date(booking.estimatedStart).getTime();
        const now = Date.now();
        const remaining = startTime - now;

        if (remaining <= 0) {
          updatedCountdowns[booking._id] = "NOW";
        } else {
          const totalSeconds = Math.floor(remaining / 1000);
          const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
          const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
          const seconds = String(totalSeconds % 60).padStart(2, "0");

          updatedCountdowns[booking._id] = `${hours}:${minutes}:${seconds}`;
        }
      });

      setCountdowns(updatedCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [userBookings]);


  const primaryBtnStyle = {
    padding: "12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    width: "100%",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "1rem"
  };


  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;

    try {
      const res = await fetch(`${liveURl}/api/book/bookings/delete/${bookingId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        // Remove from local state
        setUserBookings(prev => prev.filter(b => b._id !== bookingId));
        alert("Booking deleted successfully.");
      } else {
        alert("Failed to delete booking.");
      }
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Error deleting booking.");
    }
  };

  const isNow = (startTime, duration) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return now >= start && now <= end;
  };


  const [schedule, setSchedule] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [formattedTime, setFormattedTime] = useState("");

  const isDateClosed = (dateObj, leaveArray) => {
    const formatted = dateObj.toISOString().slice(0, 10); // "yyyy-mm-dd"
    return leaveArray?.includes(formatted);
  };


  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`${liveURl}/api/maintain/days/schedule`);
        if (!res.ok) throw new Error("Network response was not ok");

        const data = await res.json();
        setSchedule(data);
      } catch (err) {
        console.error("Failed to fetch schedule", err);
      }
    };

    fetchSchedule(); // Initial load
    const interval = setInterval(fetchSchedule, 2000); // ✅ Every 2 seconds

    return () => clearInterval(interval);
  }, []);


  // Check current time and update booking state every minute
  useEffect(() => {
    if (!schedule || !schedule.openingHours) return;

    const checkTime = () => {
      const now = new Date();
      const today = now.toLocaleDateString("en-US", { weekday: "long" });

      const hours = schedule.openingHours[today];

      const isWeeklyOff = schedule.offDays?.includes(today);
      const isAccidentalLeave = isDateClosed(now, schedule.accidentalLeaves);
      const isSpecialClosure = isDateClosed(now, schedule.specialClosures);
      const isTimeDefined = hours && hours.open && hours.close;

      const isTodayClosed = isWeeklyOff || isAccidentalLeave || isSpecialClosure || !isTimeDefined;

      if (!isTodayClosed) {
        const [openHour, openMin] = hours.open.split(":").map(Number);
        const [closeHour, closeMin] = hours.close.split(":").map(Number);

        const openTime = new Date(now);
        openTime.setHours(openHour, openMin, 0, 0);

        const closeTime = new Date(now);
        closeTime.setHours(closeHour, closeMin, 0, 0);

        if (now >= openTime && now <= closeTime) {
          setIsBookingOpen(true);
          setFormattedTime("");
          return;
        }

        if (now < openTime) {
          const fHour = openHour % 12 || 12;
          const fMin = openMin.toString().padStart(2, "0");
          const period = openHour >= 12 ? "PM" : "AM";
          setFormattedTime(`${today} ${fHour}:${fMin} ${period}`);
          setIsBookingOpen(false);
          return;
        }
      }

      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(now.getTime() + i * 86400000); // i days later
        const nextDay = nextDate.toLocaleDateString("en-US", { weekday: "long" });
        const nextHours = schedule.openingHours[nextDay];

        const isNextOff = schedule.offDays?.includes(nextDay);
        const isNextAccidental = isDateClosed(nextDate, schedule.accidentalLeaves);
        const isNextClosure = isDateClosed(nextDate, schedule.specialClosures);

        if (
          isNextOff ||
          isNextAccidental ||
          isNextClosure ||
          !nextHours ||
          !nextHours.open ||
          !nextHours.close
        ) {
          continue;
        }

        const [openHour, openMin] = nextHours.open.split(":").map(Number);
        const fHour = openHour % 12 || 12;
        const fMin = openMin.toString().padStart(2, "0");
        const period = openHour >= 12 ? "PM" : "AM";

        setFormattedTime(`${nextDay} ${fHour}:${fMin} ${period}`);
        setIsBookingOpen(false);
        return;
      }

      // No valid open day found
      setFormattedTime("");
      setIsBookingOpen(false);
    };


    checkTime(); // Initial check
    const interval = setInterval(checkTime, 2000); // Check every minute

    return () => clearInterval(interval);
  }, [schedule]);

  // Optional: Helper to get next opening day (used for UI messages)
  const getNextOpenDay = () => {
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now.getTime() + i * 86400000); // i days from now
      const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" });

      const hours = schedule?.openingHours?.[dayName];
      if (!hours || !hours.open || !hours.close || schedule.offDays.includes(dayName)) {
        continue;
      }

      const [openHour, openMin] = hours.open.split(":").map(Number);
      const [closeHour, closeMin] = hours.close.split(":").map(Number);

      const openTime = new Date(checkDate);
      openTime.setHours(openHour, openMin, 0, 0);

      const closeTime = new Date(checkDate);
      closeTime.setHours(closeHour, closeMin, 0, 0);

      // If today and now is before opening
      if (i === 0 && now < openTime) {
        return { dayName, openHour, openMin };
      }

      // If today and currently open
      if (i === 0 && now >= openTime && now <= closeTime) {
        return null; // already open
      }

      // Otherwise, future open day
      if (i > 0 || now > closeTime) {
        return { dayName, openHour, openMin };
      }
    }

    return null;
  };

  // Call this in your UI to show "Opening at..."
  const getOpeningDayName = () => {
    const next = getNextOpenDay();
    if (!next) return "";

    const { dayName, openHour, openMin } = next;
    const fHour = openHour % 12 || 12;
    const fMin = openMin.toString().padStart(2, "0");
    const period = openHour >= 12 ? "PM" : "AM";

    setFormattedTime(`${fHour}:${fMin} ${period}`);
    return dayName;
  };


  const handleNewBooking = () => {
    setIsBookingOpen(true);
    const savedPhone = localStorage.getItem("userPhone");
    const savedUser = localStorage.getItem("user");

    if (savedPhone && savedUser) {
      setPhone(savedPhone);
      setUser(JSON.parse(savedUser));
      setStep("service");
      setStepStage("services");
    } else {
      setUser(null);
      setPhone("");
      setStep("phone");
      setStepStage("services");
    }

    // Reset state
    setSelectedService([]);
    setSelectedBarber("");
    setUserBookings([]);
    // setServiceStep("main"); // ✅ Add this to start at main services every time

    setServiceStepIndex(0); // ✅ Reset to first step dynamically
  };


  useEffect(() => {
    if (stepStage === "barber" && !selectedBarber) {
      setSelectedBarber("Jayesh");
    }
  }, [stepStage]);

  const [isAllOpen, setIsAllOpen] = useState(false);

  const renderServiceSection = (title, serviceList) => {
    if (!serviceList?.length) return null;

    return (
      <div key={title} className="service-category">
        {/* Category title */}
        <div
          className="service-category-header2"
          style={{
            padding: "10px 0",
            borderBottom: "1px solid #262626ff",
          }}
        >
          <h4
            style={{
              color: "#000000ff",
              margin: 0,
              fontSize: "1.5rem",
            }}
          >
            {title}
          </h4>
        </div>

        {/* Services list */}
        <div className="service-list-wrapper open">
          <div className="service-list">
            {serviceList.map((s, idx) => (
              <div
                key={idx}
                className={`service-card ${selectedService.some((sel) => sel.name === s.name)
                  ? "selected"
                  : ""
                  }`}
              >
                <label
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedService.some(
                      (sel) => sel.name === s.name
                    )}
                    onChange={() => {
                      const exists = selectedService.find(
                        (sel) => sel.name === s.name
                      );
                      setSelectedService(
                        exists
                          ? selectedService.filter(
                            (sel) => sel.name !== s.name
                          )
                          : [...selectedService, s]
                      );
                    }}
                  />
                  <div className="service-content">
                    <div className="service-name">{s.name}</div>
                    <div className="service-meta-desc">{s.description}</div>
                    <div className="service-meta">${s.price}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };



  const goNextServiceStep = () => {
    setServiceStepIndex((prev) => prev + 1);
  };

  const goBackServiceStep = () => {
    setServiceStepIndex((prev) => prev - 1);
  };

  const formatCategoryName = (key) => {
    return key
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const getServiceNextLabel = () => {
    if (serviceStepIndex < categoryKeys.length - 1) {
      const nextKey = categoryKeys[serviceStepIndex + 1];
      return `Next: ${formatCategoryName(nextKey)} ➡️`;
    }
    return "Next: Select Barber ➡️";
  };


  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert("⚠️ Please enter the OTP.");
      return;
    }

    try {
      const res = await fetch(`${liveURl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.userExists) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("userPhone", phone);
          setStep("service");
        } else {
          setNewUser({ ...newUser, phone });
          setStep("register");
        }
      } else {
        alert("❌ Invalid or expired OTP.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("❌ Failed to verify OTP.");
    }
  };


  const resendOtp = async () => {
    try {
      const res = await fetch(`${liveURl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ OTP resent successfully.");
      } else {
        alert("❌ Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      alert("❌ Could not resend OTP.");
    }
  };


  const handleAddChildBooking = () => {
    setIsChildBooking(true);         // Mark as child
    setStepStage("services");        // Go back to service selection
    setSelectedService([]);          // Reset selected services
    setSelectedBarber("");           // Reset barber
    setServiceStepIndex(0);
  };

  const [showHours, setShowHours] = useState(false);
  const [phoneInputVisible, setPhoneInputVisible] = useState(false);
  // const [schedule, setSchedule] = useState([]);
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const formatTime = (time) => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minute} ${suffix}`;
  };



  const [queue, setQueue] = useState([]);
  const [firstETA, setFirstETA] = useState("--");

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`${liveURl}/api/book/live-queue/getting`);
        const data = await res.json();
        setQueue(data.queue || []);
      } catch (err) {
        console.error("Failed to fetch queue", err);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!queue.length) {
      setFirstETA("00 Minute Wait");
      return;
    }

    const now = new Date();
    let totalWaitMs = 0;

    queue.forEach((booking, index) => {
      const estStart = new Date(booking.estimatedStart);
      const estEnd = new Date(estStart.getTime() + booking.duration * 60000);

      if (estEnd <= now) return; // skip past bookings (already done)

      if (index === 0) {
        // For first (current) customer, only count remaining time
        const remaining = estEnd - now;
        totalWaitMs += remaining > 0 ? remaining : 0;
      } else {
        // For others, add full duration
        totalWaitMs += booking.duration * 60000;
      }
    });

    // Convert totalWaitMs to minutes
    const totalMinutes = Math.ceil(totalWaitMs / 60000);

    if (totalMinutes <= 0) {
      setFirstETA("00 Minute Wait");
    } else {
      setFirstETA(`${totalMinutes} Minute Wait`);
    }
  }, [queue]);


  // Conditions
  const hasBookings = userBookings.length > 0;
  const hasActiveBooking = userBookings.some(b => !b.isCompleted); // adjust field name if diff
  const canAddChild = stepStage === "done" && userBookings.filter(b => b.isChild).length < 8;

  return (
    <>
      <div className={`booking-container ${["services", "barber", "confirm", "done"].includes(stepStage)
        ? "full-width"
        : "full-screen"
        }`}>
        {/* <div className="booking-container"> */}

        <header className="booking-header">
          <div className="center-logo">
            <img src="/jaysh_barbershop_2.png" alt="Logo" className="booking-logo" style={{ borderRadius: "10%" }} />
          </div>
          {user && (
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          )}
        </header>


        <div className="booking-body">
          {/* Left Side: Booking Form */}
          <div className="booking-left">
            <div className="booking-box">
              {isBookingOpen ? (
                <>
                  {/* === STEP: PHONE === */}
                  {step === "phone" && (
                    <>
                      {(!localStorage.getItem("user")) && (

                        <div className="status-row">
                          <div className="status-box no-appointment">❌ No Appointment</div>
                          <div className="status-box checkin-today">✅ Check-in Today</div>
                        </div>
                      )}

                      <img src="/jaysh_barbershop_2.png" alt="Logo" className="booking-logo2" />
                      <p style={{ fontSize: "2rem", fontWeight: "700", color: "#000000ff " }}>Contact: </p>
                      <p className="jayesh-phone">📞 +1 (204) 558-0761</p>
                      <p className="jayesh-address">
                        📍{" "}
                        <a style={{ textDecoration: "underline", color: "green" }}
                          href="https://www.google.com/maps?q=211+12+St+Brandon,+MB+R7A+0V2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          211 12 St Brandon, MB R7A 0V2
                        </a>
                      </p>
                      <p className="jayesh-phone">✉️ Jayshbarbershop@yahoo.com</p>

                      {/* Toggle Hours Button */}
                      <div className="working-hours-toggle" onClick={() => setShowHours(!showHours)}>
                        <span style={{ cursor: "pointer", fontWeight: "bold", color: "#008EFF", fontSize: "23px" }}>
                          Working Hours: {showHours ? "−" : "+"} <strong style={{ color: "green" }} className="opening">Open</strong>
                        </span>
                       
                      </div>

                      {/* Hours List */}
                      <div className={`daily-hours-wrapper ${showHours ? "open" : ""}`}>
                        {schedule && (
                          <ul className="daily-hours-list">
                            {Object.entries(schedule.openingHours).map(([day, hours], idx) => {
                              const isClosed =
                                !hours?.open || !hours?.close || schedule.offDays?.includes(day);

                              return (
                                <li key={idx} className="daily-hours-item">
                                  <span className="day-label">{day}</span>
                                  <span className="hours-label">
                                    {isClosed ? "Closed" : `${formatTime(hours.open)} – ${formatTime(hours.close)}`}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>

                        )}
                      </div>

                      {phoneInputVisible ? (
                        <>
                          {/* Small text above input */}
                          <small style={{ color: "#3b3b3bff", marginBottom: "10px", display: "block", fontSize: "1rem" }}>
                            Please enter your mobile phone number to continue. You'll receive a One-Time Passcode(OTP) via SMS to verify your identity.
                          </small>

                          <input
                            type="text"
                            placeholder="📱 Enter your phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="booking-input2"
                          />

                          {/* Checkbox with text below input */}
                          <div style={{ marginTop: "10px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3b3b3bff", fontSize: "14px" }}>
                              <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                              />
                              I agree to receive a one-time verification SMS to the mobile phone number provided above from Jaysh Barbershop.
                            </label>
                          </div>

                          <div
                            className="phone-step-buttons"
                            style={{ display: "flex", gap: "10px", marginTop: "15px" }}
                          >
                            <button
                              onClick={() => setPhoneInputVisible(false)}
                              className="booking-button btn-secondary"
                            >
                              ⬅️ Back
                            </button>

                            <button
                              onClick={checkPhone}
                              className="booking-button btn-primary"
                              disabled={!agreeTerms} // disable until checked
                            >
                              Check In
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="initial-button">
                          <button className="booking-button btn-secondary" disabled>
                            Estimated: {firstETA}
                          </button>

                          <button
                            onClick={() => setPhoneInputVisible(true)}
                            className="booking-button btn-primary"
                          >
                            Check In Now
                          </button>
                        </div>
                      )}

                    </>
                  )}




                  {/* === STEP: REGISTER === */}
                  {step === "register" && (
                    <>
                      <h4>Register New User</h4>
                      <input
                        type="text"
                        placeholder="📞 Phone"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="booking-input"
                      />
                      <input
                        type="text"
                        placeholder="👤 Full Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="booking-input"
                      />
                      <button onClick={registerUser} className="booking-button btn-green">
                        Register & Continue
                      </button>
                    </>
                  )}

                  {/* === STEP: OTP === */}
                  {step === "otp" && (
                    <>
                      <h4 style={{ color: "#000000ff" }}>🔐 Verify OTP</h4>
                      <input
                        type="text"
                        placeholder="Enter the OTP sent to your phone"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="booking-input"
                      />
                      <button onClick={verifyOtp} className="booking-button btn-green">
                        Verify OTP
                      </button>
                      <button onClick={resendOtp} className="booking-button btn-gray">
                        Resend OTP
                      </button>
                    </>
                  )}


                  {/* === STEP: SERVICE === */}
                  {step === "service" && user && (
                    <>
                      <div className="service-item">
                        <h3 style={{ color: "#000000ff" }}>Welcome, {user.name}</h3>
                        {stepStage === "done" && countdown && (
                          <>
                            <p style={{ color: "#000000ff" }}><strong>Your Phone 📞:</strong> {user.phone}</p>
                          </>
                        )}
                      </div>

                      {/* === SERVICES === */}

                      {stepStage === "services" && (
                        <>
                          {/* Status Row */}
                          {(!localStorage.getItem("user")) && (
                            <div className="status-row">
                              <div className="status-box no-appointment">❌ No Appointment</div>
                              <div className="status-box checkin-today">✅ Check-in Today</div>
                            </div>
                          )}

                          {/* All Categories Expand/Collapse */}
                         
                          <h3 className="service-title">Select Services 💇:</h3>

                          <div className="services-scroll-container">


                            {/* Only renders categories if expanded */}
                            {Object.keys(services).map(categoryKey => {
                              let filtered = services[categoryKey];

                              if (isChildBooking) {
                                filtered = filtered.filter(s => s.isChild);
                              }

                              if (!filtered.length) return null;

                              return renderServiceSection(
                                categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
                                filtered
                              );
                            })}
                          </div>


                          {/* Booking Summary */}
                          {selectedService.length > 0 && (
                            <div className="summary-box">
                              <h4 className="summary-title">🧾 Booking Summary</h4>
                              <ul className="summary-items">
                                {selectedService.map((s, idx) => (
                                  <li key={idx}>
                                    <span className="service-name1">{s.name}</span>
                                    <span className="service-meta1">
                                      ${s.price}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="summary-total">
                                <div>
                                  <strong>Total:</strong> $
                                  {selectedService
                                    .reduce((sum, s) => sum + s.price, 0)
                                    .toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Step Buttons */}
                          {/* Step Buttons */}
                          <div className="service-step-buttons">
                            {serviceStepIndex > 0 && (
                              <button
                                onClick={goBackServiceStep}
                                className="booking-button btn-secondary"
                              >
                                ⬅️ Back
                              </button>
                            )}

                            {/* Cancel Button */}
                            <button
                              onClick={() => window.location.reload()}
                              className="booking-button btn-danger"
                              style={{ backgroundColor: "red", color: "white" }}
                            >
                              ❌ Cancel
                            </button>

                            <button
                              onClick={() => setStepStage("barber")}
                              className="booking-button btn-primary"
                            >
                              Next ➡️
                            </button>
                          </div>

                        </>
                      )}



                      {/* === BARBER === */}
                      {stepStage === "barber" && (
                        <>
                          <h4 className="barber-title">✂️ Select a Barber</h4>
                          <div className="barber-list">
                            {["Jayesh"].map((barber, idx) => (
                              <label key={idx} className={`barber-card ${selectedBarber === barber ? "selected" : ""}`}>
                                <input
                                  type="radio"
                                  name="barber"
                                  value={barber}
                                  checked={selectedBarber === barber}
                                  onChange={() => setSelectedBarber(barber)}
                                />
                                <div className="barber-info">
                                  <span className="barber-name">{barber}</span>
                                  <span className="barber-role">Senior Stylist</span>
                                </div>
                              </label>
                            ))}
                          </div>
                          <div className="barber-buttons">
                            <button onClick={() => setStepStage("services")} className="booking-button btn-secondary">← Back</button>
                            <button
                              disabled={!selectedBarber}
                              onClick={() => setStepStage("confirm")}
                              className="booking-button btn-green"
                            >
                              Confirm Barber
                            </button>
                          </div>
                        </>
                      )}

                      {/* === CONFIRM === */}
                      {stepStage === "confirm" && (
                        <div className="confirm-box">
                          <h4 className="confirm-title">📋 Review & Confirm</h4>
                          <div className="confirm-summary">
                            <p style={{ fontSize: "1.2rem", color: "#000000ff" }}><strong>Barber:</strong> {selectedBarber}</p>
                            <div className="confirm-services">
                              <p style={{ fontSize: "1.5rem", color: "#000000ff" }}><strong>Selected Services:</strong></p>
                              <ul className="confirm-service-list">
                                {selectedService.map((s, idx) => (
                                  <li key={idx}>
                                    <span style={{ color: "#000000ff" }}>{s.name}</span>
                                    <span style={{ color: "#000000ff" }}>${s.price}</span>
                                    {/* <span style={{ color: "#ffffff" }}>${s.price} ({s.duration} min)</span> */}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="confirm-totals" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                              <p style={{ color: "#000000ff" }}><strong>Total:</strong> ${selectedService.reduce((sum, s) => sum + s.price, 0)}</p>
                              {/* <p style={{ color: "#ffffff" }}><strong>Duration:</strong> {selectedService.reduce((sum, s) => sum + s.duration, 0)} min</p> */}
                            </div>
                            <div style={{ display: "flex", flexDirection: "row" }}>
                              <button
                                disabled={!selectedService.length || !selectedBarber}
                                onClick={handleConfirmBooking}
                                className="booking-button btn-green"
                              >
                                ✅ Confirm Booking
                              </button>
                              <button
                                onClick={() => window.location.reload()}
                                className="booking-button btn-danger"
                                style={{ backgroundColor: "red", color: "white" }}
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}


                      {userBookings.map((booking, i) => {
                        const isChild = booking.isChild;
                        const countdown = countdowns[booking._id]; // 👈 get individual countdown

                        return (
                          <div key={i} className="booking-history-card">
                            <p>
                              <strong style={{ fontSize: "1.3rem", color: "#000000ff" }}>{isChild ? "👶 Child Booking" : "🧑 Your Booking"}</strong>
                            </p>
                            <p style={{ fontSize: "1.1rem", color: "#000000ff" }}><strong style={{ fontSize: "1.1rem" }}>Barber:</strong> {booking.barber}</p>
                            <p style={{ color: "#000000ff" }}><strong>Services:</strong> {booking.services.map(s => s.name).join(", ")}</p>
                            <p style={{ color: "#000000ff" }}>
                              <strong>Status:</strong>{" "}
                              {isNow(booking.estimatedStart, booking.duration)
                                ? "🟢 Your Turn"
                                : booking.status}
                            </p>

                            <p style={{ color: "#000000ff" }}>
                              <strong>ETA:</strong>{" "}
                              <span style={{ color: "green", fontWeight: "bold" }}>
                                {countdown || "--:--:--"}
                              </span>
                              {countdown !== "NOW" && " minutes"}
                            </p>

                            <button
                              onClick={() => deleteBooking(booking._id)}
                              className="booking-button btn-danger"
                            >
                              🗑️ Delete Booking
                            </button>
                          </div>
                        );
                      })}


                      {/* === ACTIONS ===  */}
                      {/* === ACTIONS === */}
                      {/* === ACTION BUTTONS === */}
                      <div style={{ textAlign: "center", marginTop: "20px" }}>
                        {(() => {
                          // No bookings yet → show Book New
                          if (!userBookings.length && stepStage !== "services" && stepStage !== "barber" && stepStage !== "confirm") {
                            return (
                              <button onClick={handleNewBooking} className="booking-button btn-primary">
                                Book New
                              </button>
                            );
                          }

                          // Booking just finished → show Add Child + Book Another
                          if (stepStage === "done") {
                            return (
                              <>
                                {userBookings.filter(b => b.isChild).length < 8 && (
                                  <button onClick={handleAddChildBooking} className="booking-button btn-primary">
                                    ➕ Add Child
                                  </button>
                                )}
                                <button onClick={handleNewBooking} className="booking-button btn-primary">
                                  Add Guest
                                </button>
                              </>
                            );
                          }

                          // Default: no buttons while booking is in progress
                          return null;
                        })()}
                      </div>


                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="status-row">
                    <div className="status-box no-appointment">❌ No Appointment</div>
                    <div className="status-box checkin-today">✅ Check-in Today</div>
                  </div>
                  <img src="/jaysh_barbershop_2.png" alt="Logo" className="booking-logo2" />
                  <p style={{ fontSize: "2rem", fontWeight: "700", color: "#000000ff " }}>Contact: </p>
                  <p className="jayesh-phone">📞 +1 (204) 558-0761</p>
                  <p className="jayesh-address">
                    📍{" "}
                    <a style={{ textDecoration: "underline", color: "green" }}
                      href="https://www.google.com/maps?q=211+12+St+Brandon,+MB+R7A+0V2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      211 12 St Brandon, MB R7A 0V2
                    </a>
                  </p>
                  <p className="jayesh-phone">✉️ Jayshbarbershop@yahoo.com</p>


                  {/* Toggle Hours Button */}
                  <div className="working-hours-toggle" onClick={() => setShowHours(!showHours)}>
                    <span style={{ cursor: "pointer", fontWeight: "bold", color: "#008EFF", fontSize: "23px" }}>
                      Working Hours: {showHours ? "−" : "+"} <strong style={{ color: "#fc0000ff" }}>Closed</strong>
                    </span>
                  </div>

                  {/* Hours List */}
                  <div className={`daily-hours-wrapper ${showHours ? "open" : ""}`}>
                    {schedule && (
 
                      <ul className="daily-hours-list">
                        {Object.entries(schedule.openingHours).map(([day, hours], idx) => {
                          const isClosed =
                            !hours?.open || !hours?.close || schedule.offDays?.includes(day);

                          return (
                            <li key={idx} className="daily-hours-item">
                              <span className="day-label">{day}:</span>
                              <span className="hours-label">
                                {isClosed ? "Closed" : `${formatTime(hours.open)} – ${formatTime(hours.close)}`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                    )}
                  </div>

                  <button className="booking-button btn-secondary" disabled>
                    <FiClock style={{ marginRight: "8px" }} />
                    Opening at {formattedTime}
                  </button>
                </>
              )}

            </div>
          </div>

          {/* Right Side: Image Carousel */}
          {(!localStorage.getItem("user")) && (
            <div className="booking-right">
              <ImageSlider />
            </div>
          )}
        </div>


        {/* {(!["services", "barber", "confirm", "done"].includes(stepStage) || !localStorage.getItem("user")) && ( */}
        {(!localStorage.getItem("user")) && (

          <div className="services-structured-container">
            <div className="inrow1">
              <div className="service-category">
                <h2 className="category-heading">Haircuts</h2>
                <ul className="service-list">
                  <li>
                    <span>Adult <small>Ages 12 – 64</small></span>
                    <span className="pricing">$27</span>
                  </li>
                  <li>
                    <span>Kids <small>Ages 0–11</small></span>
                    <span className="pricing">$20</span>
                  </li>
                  <li>
                    <span>Senior <small>Ages 65+</small></span>
                    <span className="pricing">$22</span>
                  </li>
                  <li>
                    <span>Buzz Cut <small>(One guard)</small></span>
                    <span className="pricing">$25</span>
                  </li>
                  <li>
                    <span>Hair Wash <small>With Shampoo, Conditioner and hot towel</small></span>
                    <span className="pricing">$5</span>
                  </li>
                </ul>

              </div>

              <div className="service-category">
                <h2 className="category-heading">Add-On Services</h2>
                <ul className="service-list">
                  <li><span className="second">Back Of Neck Shave</span><span className="pricing">$5</span></li>
                  <li><span className="second">Beard Trim</span><span className="pricing">$25</span></li>
                  <li><span className="second">Hair Tattoo</span><span className="pricing">$5</span></li>
                  <li><span className="second">Straight Razor Skin Fade</span><span className="pricing">$10</span></li>
                  <li><span className="second">Hair Colour</span><span className="pricing">$35</span></li>
                </ul>
              </div>
            </div>

            <div className="bottom-row">
              <div className="left-half">
                <div className="vertical-shave-text">
                  <span>SHAVE</span>
                </div>

                <div className="shave-column-wrapper">
                  <div className="shave-services service-category">
                    <ul className="service-list">
                      <li><span>Head Shave</span><span className="pricing">$30</span></li>
                      <li className="desc">Straight razor shave all over the top of the head</li>
                      <li><span>Face Shave</span><span className="pricing">$30</span></li>
                      <li className="desc">Straight razor shave on cheeks & neck</li>
                      <li><span>Goatee</span><span className="pricing">$25</span></li>
                      <li className="desc">Leaves tidy moustache or goatee</li>
                    </ul>
                  </div>

                  {/* 🔻 Divider Line */}
                  <hr className="shave-divider" />

                  {/* 🔻 Facial Steaming */}
                  <div className="service-category">
                    <ul className="service-list">
                      <li><span>Facial Steaming</span><span className="pricing">$25</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="right-half">
                <div className="service-category">
                  <h2 className="category-heading">Waxing</h2>
                  <ul className="service-list">
                    <li><span className="second">Eyebrows</span><span className="pricing">$5</span></li>
                    <li><span className="second">Ears or Nose</span><span className="pricing">$7</span></li>
                  </ul>
                </div>

                <div className="service-category">
                  <h2 className="category-heading">Combo</h2>
                  <ul className="service-list">
                    <li><span className="second">Haircut & Beard Trim</span><span className="pricing">$40</span></li>
                    <li><span className="second">Haircut & Shave</span><span className="pricing">$55</span></li>
                    <li><span className="second">Haircut & Hair Color</span><span className="pricing">$60</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {(!localStorage.getItem("user")) && (

        <Footer />
      )}
    </>
  );

};

export default Booking;














{/* Global toggle */ }
{/* <div
                              className="services-global-header"
                              onClick={() => setIsAllOpen(!isAllOpen)}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                padding: "10px 0",
                                borderBottom: "1px solid #262626ff",
                                background: "#090909", // keeps background solid when sticky
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                              }}
                            >
                              <h4 style={{ color: "#fff", margin: 0, fontSize: "1.5rem" }}>
                                Services
                              </h4>
                              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffffff" }}>
                                {isAllOpen ? "−" : "+"}
                              </span>
                            </div> */}