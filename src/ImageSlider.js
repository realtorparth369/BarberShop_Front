import React, { useState, useEffect, useRef } from "react";
import "./ImageSlider.css";

const images = [
  "/tg-locations-generic-6_large.jpg",
  "/tg-locations-generic-9_large.jpg",
  "/tg-locations-generic-4_large.jpg",
];

const ImageSlider = () => {
  const [current, setCurrent] = useState(0);
  const slideRef = useRef(null);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleResize = () => {
      if (slideRef.current) {
        slideRef.current.style.transform = `translateX(-${current * slideRef.current.offsetWidth}px)`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [current]);

  return (
    <div className="custom-slider">
      <div className="slides-container" ref={slideRef} style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((img, idx) => (
          <img key={idx} src={img} alt={`Slide ${idx + 1}`} className="slider-image" />
        ))}
      </div>

      <button className="nav prev" onClick={prevSlide}>❮</button>
      <button className="nav next" onClick={nextSlide}>❯</button>

      <div className="dots">
        {images.map((_, idx) => (
          <button key={idx} className={idx === current ? "active" : ""} onClick={() => goToSlide(idx)}></button>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
