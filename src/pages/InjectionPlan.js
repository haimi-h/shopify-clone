import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import '../InjectionPlan.css';

function InjectionPlan() {
  const [data, setData] = useState([]); // Initialize with empty array, data will come from backend
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false); // State to control add modal visibility
  const [newInjection, setNewInjection] = useState({ // State for new injection form data
    injection_order: '',
    commission_rate: 50.0, // Default value
    injections_amount: ''
  });

  // This userId should ideally come from a user context or props after login
  // For demonstration, we'll use '44128' as per your screenshot and backend routes
  const userId = '44128';
  const API_BASE_URL = 'http://localhost:5000/api'; // Adjust this if your backend runs on a different port or domain

  // Function to fetch injection plans from the backend
  const fetchInjectionPlans = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // Retrieve the authentication token (assuming it's stored in localStorage after login)
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/injection-plans/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}` // Include JWT token in headers
        }
      });

      // Assuming the backend returns an array of injection plans
      // The backend model (injectionPlan.model.js) returns:
      // id, user_id, injection_order, commission_rate, injections_amount
      // We will map these to the frontend's expected 'data' structure
      setData(response.data.map(item => ({
        id: item.id,
        uid: item.user_id, // Map user_id from backend to uid for frontend display
        order: item.injection_order,
        commission: `${item.commission_rate}%`,
        amount: item.injections_amount,
        // These fields (completed, taskNumber, completionTime, creationTime)
        // are not directly in the `injection_plans` table as per your model.
        // They would likely be derived or fetched from associated 'tasks'.
        // For now, we'll leave them as placeholders or default values.
        // In a real scenario, your backend API for getInjectionsByUserId
        // might need to join with tasks or provide this derived information.
        completed: false, // Defaulting as backend doesn't provide this directly for injection plans
        taskNumber: '',   // Defaulting
        completionTime: '', // Defaulting
        creationTime: item.created_at ? new Date(item.created_at).toLocaleString() : '-', // Assuming created_at from backend
      })));

    } catch (err) {
      console.error("Error fetching injection plans:", err);
      if (err.response) {
        // Specific error messages from backend
        if (err.response.status === 403) {
          setError("Access Denied: You do not have administrator privileges.");
        } else if (err.response.status === 401) {
          setError("Unauthorized: Please log in again.");
        } else {
          setError(`Failed to load injection plans: ${err.response.data.message || err.message}`);
        }
      } else {
        setError(`Failed to load injection plans. Network error or server not reachable: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts or userId changes
  useEffect(() => {
    fetchInjectionPlans();
  }, [userId]); // Dependency array: re-run effect if userId changes

  // Handler for editing an injection plan (will open a modal/form)
  const handleEdit = (id) => {
    alert(`Edit clicked for ID: ${id}. This will open a form to edit the data.`);
    // In a full implementation, you'd fetch the specific item's data,
    // open a modal/form, pre-fill it, and then make a PUT request on save.
  };

  // Handler for deleting an injection plan
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication token not found. Please log in.");
          return;
        }

        await axios.delete(`${API_BASE_URL}/injection-plans/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Optimistically update the UI by filtering out the deleted item
        setData(data.filter(item => item.id !== id));
        alert('Injection plan deleted successfully!');
      } catch (err) {
        console.error("Error deleting injection plan:", err);
        if (err.response) {
          setError(`Failed to delete injection plan: ${err.response.data.message || err.message}`);
        } else {
          setError(`Failed to delete injection plan. Network error: ${err.message}`);
        }
        alert('Failed to delete injection plan. Check console for details.');
      }
    }
  };

  // Handler for opening the add new injection plan modal/form
  const handleAdd = () => {
    setShowAddModal(true);
    setNewInjection({ // Reset form fields when opening
      injection_order: '',
      commission_rate: 50.0,
      injections_amount: ''
    });
  };

  // Handler for input changes in the add new injection form
  const handleNewInjectionChange = (e) => {
    const { name, value } = e.target;
    setNewInjection(prev => ({ ...prev, [name]: value }));
  };

  // Handler for submitting the new injection plan form
  const handleNewInjectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please log in.");
        return;
      }

      // Basic validation
      if (!newInjection.injection_order || !newInjection.injections_amount) {
        alert("Please fill in both Injection Order and Amount.");
        return;
      }
      if (isNaN(newInjection.injection_order) || parseInt(newInjection.injection_order) <= 0) {
        alert("Injection Order must be a positive number.");
        return;
      }
      if (isNaN(newInjection.injections_amount) || parseFloat(newInjection.injections_amount) <= 0) {
        alert("Injection Amount must be a positive number.");
        return;
      }
       if (isNaN(newInjection.commission_rate) || parseFloat(newInjection.commission_rate) <= 0) {
        alert("Commission Rate must be a positive number.");
        return;
      }


      await axios.post(`${API_BASE_URL}/injection-plans/${userId}`, {
        injection_order: parseInt(newInjection.injection_order),
        commission_rate: parseFloat(newInjection.commission_rate),
        injections_amount: parseFloat(newInjection.injections_amount)
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Injection plan added successfully!');
      setShowAddModal(false); // Close the modal
      fetchInjectionPlans(); // Refresh the list
    } catch (err) {
      console.error("Error adding injection plan:", err);
      if (err.response) {
        setError(`Failed to add injection plan: ${err.response.data.message || err.message}`);
      } else {
        setError(`Failed to add injection plan. Network error: ${err.message}`);
      }
      alert('Failed to add injection plan. Check console for details.');
    }
  };


  return (
    <div className="container">
      <div className="header">
        <h2>UID: {userId} Injection Plan</h2> {/* Dynamically display UID */}
        <button className="add-button" onClick={handleAdd}>Add Injection</button>
      </div>

      {loading ? (
        <p>Loading injection plans...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="table-container">
          <table className="injection-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>UID</th>
                <th>Injection Order</th>
                <th>Commission Rate</th>
                <th>Injections Amount</th>
                <th>Completed</th>
                <th>Task Order Number</th>
                <th>Completion Time</th>
                <th>Creation Time</th>
                <th colSpan="2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="10">No injection plans found.</td>
                </tr>
              ) : (
                data.slice(0, rowsPerPage).map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.uid}</td>
                    <td>{item.order}</td>
                    <td>{item.commission}</td>
                    <td>{item.amount}</td>
                    {/* These static values assume the backend won't provide them directly
                        from the injection_plans table. Adjust if your backend does. */}
                    <td><span className={item.completed ? "completed-label" : "unfinished-label"}>
                      {item.completed ? "Completed" : "Unfinished"}
                    </span></td>
                    <td>{item.taskNumber || '-'}</td>
                    <td>{item.completionTime || '-'}</td>
                    <td>{item.creationTime}</td>
                    <td><button className="edit-button" onClick={() => handleEdit(item.id)}>Edit</button></td>
                    <td><button className="delete-button" onClick={() => handleDelete(item.id)}>Delete</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="footer">
        <span>Total {data.length} records, displayed per page:</span>
        <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}>
          {[5, 10, 20, 50].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {/* Basic pagination display (client-side, based on fetched data) */}
        <span>Total {Math.ceil(data.length / rowsPerPage)} page. Currently showing page 1.</span>
      </div>

      {/* Add Injection Plan Modal/Form */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Injection Plan</h3>
            <form onSubmit={handleNewInjectionSubmit}>
              <div className="form-group">
                <label>Injection Order:</label>
                <input
                  type="number"
                  name="injection_order"
                  value={newInjection.injection_order}
                  onChange={handleNewInjectionChange}
                  placeholder="e.g., 1 (for first lucky order)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Commission Rate (%):</label>
                <input
                  type="number"
                  name="commission_rate"
                  value={newInjection.commission_rate}
                  onChange={handleNewInjectionChange}
                  placeholder="e.g., 50 (for 50%)"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (USD):</label>
                <input
                  type="number"
                  name="injections_amount"
                  value={newInjection.injections_amount}
                  onChange={handleNewInjectionChange}
                  placeholder="e.g., 100"
                  step="0.01"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="add-button">Create Injection</button>
                <button type="button" className="delete-button" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InjectionPlan;