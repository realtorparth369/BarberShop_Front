import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BarberServicesManager.css";
import { Link } from "react-router-dom";

const BarberServicesManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    isChild: false,
  });

  const [editMode, setEditMode] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);


  // const liveURl = "http://localhost:5000";
  const liveURl = "http://44.245.249.133:5000";
  // const liveURl = "192.168.29.151:5000";

  const fetchCategories = async () => {
    const res = await axios.get(`${liveURl}/api/maintain/services/categories`);
    setCategories(res.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axios.post(`${liveURl}/api/maintain/services/categories`, {
        category: newCategory.toLowerCase(),
      });
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      alert("Failed to add category. It may already exist.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure to delete this category?")) return;
    await axios.delete(`${liveURl}/api/maintain/services/categories/${id}`);
    fetchCategories();
  };

  const openAddServiceModal = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setFormData({ name: "", description: "", price: "", duration: "", isChild: false });
    setEditMode(false);
    setAddModalOpen(true);
  };

  const openEditServiceModal = (categoryId, service) => {
    setSelectedCategoryId(categoryId);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      isChild: service.isChild,
    });
    setEditingServiceId(service._id);
    setEditMode(true);
    setEditModalOpen(true);
  };

  const handleDeleteService = async (categoryId, serviceId) => {
    if (!window.confirm("Delete this service?")) return;
    await axios.delete(`${liveURl}/api/maintain/services/services/${categoryId}/delete/${serviceId}`);
    fetchCategories();
  };

  const handleAddOrEditSubmit = async () => {
    const { name, description, price, duration, isChild } = formData;
    if (!name || !price || !duration) {
      alert("All fields are required");
      return;
    }

    try {
      if (editMode) {
        // Edit mode
        await axios.put(
          `${liveURl}/api/maintain/services/services/${selectedCategoryId}/edit/${editingServiceId}`,
          {
            name,
            description,
            price: Number(price),
            duration: Number(duration),
            isChild,
          }
        );
        setEditModalOpen(false);
      } else {
        // Add mode
        await axios.post(`${liveURl}/api/maintain/services/services/${selectedCategoryId}/add`, {
          name,
          description,
          price: Number(price),
          duration: Number(duration),
          isChild,
        });
        setAddModalOpen(false);
      }

      fetchCategories();
    } catch (err) {
      alert("Failed to save service");
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
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
            <Link to="/manage-schedule">Day's Management</Link>
            <Link to="/manage-services" style={{ color: '#008EFF' }}>Services Management</Link>
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
            <a href="/manage-schedule">Day's Management</a>
            <a href="/manage-services" style={{ color: '#008EFF' }}>Services Management</a>
            <a href="/viewer-only">Up Next</a>

            {/* Add Walk-In button inside menu for mobile */}

          </div>
        </div>
      </div>

      <div className="barber-service-container">
        <h2 style={{ fontSize: "2rem" }}>🧰 Barber Service Manager</h2>

        <div className="add-category-form">
          <input
            type="text"
            placeholder="Add new category (e.g. facial)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleAddCategory}>➕ Add Category</button>
        </div>

        {categories.map((cat) => (
          <div key={cat._id} className="category-box">
            <div className="category-header">
              <h3 style={{ textTransform: "capitalize", fontSize: "1.8rem" }}>📂 {cat.category}</h3>
              <div className="btncombine">
                <button onClick={() => openAddServiceModal(cat._id)} >✚ Add Service</button>
                <button onClick={() => handleDeleteCategory(cat._id)} className="delete-btn">
                  🗑️ Delete Category
                </button>
              </div>
              <div className="mobilebtncombine">
                <button onClick={() => openAddServiceModal(cat._id)}>✚</button>
                <button onClick={() => handleDeleteCategory(cat._id)} className="delete-btn">
                  🗑️
                </button>
              </div>
            </div>

            <ul className="service-list">
              {cat.services.map((s) => (
                <li key={s._id} className="service-itemmm">
                  <div className="listofServices">
                    {/* <div style={{ fontSize: "1.5rem", padding: "0.5rem" }}> */}
                    <strong>{s.name}</strong> — ${s.price} ({s.duration} min)
                    <p style={{fontSize: "1.2rem", color: "#787878ff"}}>{s.description}</p>
                  </div>
                  <div>
                    <button onClick={() => openEditServiceModal(cat._id, s)}>✏️</button>
                    <button onClick={() => handleDeleteService(cat._id, s._id)}>🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* === Shared Modal for Add/Edit === */}
      {(addModalOpen || editModalOpen) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editMode ? "✏️ Edit Service" : "➕ Add New Service"}</h3>

            <label>Service Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <label>Description:</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <label>Price:</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />

            <label>Duration (min):</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={formData.isChild}
                onChange={(e) =>
                  setFormData({ ...formData, isChild: e.target.checked })
                }
              />
              is this also for child service?
            </label>


            <div className="modal-buttons">
              <button onClick={handleAddOrEditSubmit} className="btn-green">
                ✅ {editMode ? "Save Changes" : "Add Service"}
              </button>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="btn-danger"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BarberServicesManager;
