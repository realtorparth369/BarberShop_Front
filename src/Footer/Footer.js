// // src/components/Footer.js
// import React from "react";
// import "./Footer.css";
// import { Link } from "react-router-dom";

// import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

// const Footer = () => {
//   return (
//     <footer className="footer bg-theme-bg text-theme-text">
//       <div className="footer-container">
//         {/* Left: Logo + tagline */}
//         <div className="footer-section footer-brand">
//           <img src="/jaysh_barber.png" alt="Jaysh Barber" className="footer-logo" />
//           <p className="footer-tagline">Barbering Excellence, Every Cut.</p>
//         </div>

//         {/* Right: Contact Info */}
//         <div className="footer-section">
//           <h4>Contact</h4>
//           <ul>
//             <li>📍 211 12 St Brandon, MB R7A 0V2</li>
//             <li>📞 +1 (204) 558-0761</li>
//             <li>📧 info@jayshbarber.com</li>
//           </ul>
//         </div>
//       </div>

//       <div className="footer-bottom">
//         <p>© {new Date().getFullYear()} <a href="https://paramsolutions.ca/">Paramsolutions.ca</a>. All rights reserved.</p>
//       </div>
//     </footer>
//   );
// };

// export default Footer;



// src/components/Footer.js
import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer bg-theme-bg text-theme-text">
      <div className="footer-container">
        {/* Left: Logo + tagline */}
        {/* <div className="footer-section footer-brand"> */}
        {/* <img src="/jaysh_barbershop_2.png" alt="Jaysh Barber" className="footer-logo" /> */}
        {/* <p className="footer-tagline">Jaysh Barbershop where we love to exceed your expections.</p> */}

        {/* Social Links */}

        {/* </div> */}

        {/* Right: Contact Info */}
        <div className="footer-section">
          <div className="footer-social">
            <a
              href="https://www.facebook.com/share/1HV6wLJwjF/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            {/* <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a> */}
          </div>
          {/* <h4>Contact</h4>
          <ul>
            <li>📍 211 12 St Brandon, MB R7A 0V2</li>
            <li>📞 +1 (204) 558-0761</li>
            <li>📧 info@jayshbarber.com</li>
          </ul> */}
        </div>
      </div>

      <div className="footer-bottom2">
        <p className="footer-tagline">Jaysh Barbershop,  where we love to exceed your expectations.</p>
      </div>
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()}{" "}
          <a href="https://paramsolutions.ca/">Paramsolutions.ca</a>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
