import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../InjectionPlan.css'; // Ensure your CSS file is correctly linked

const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API base URL

function InjectionPlan() {
    const location = useLocation();
    const navigate = useNavigate();

    // Safely destructure userIdToInject from location.state.
    const { userIdToInject } = location.state || {};

    // State for table data
    const [data, setData] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // State for "Add Injection" modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInjection, setNewInjection] = useState({
        injection_order: '',
        commission_rate: 50.0,
        injections_amount: ''
    });

    // --- Function to fetch injection plans from the backend ---
    const fetchInjectionPlans = async () => {
        if (!userIdToInject) {
            setLoading(false);
            setError("No user selected. Please go back to User List and click 'INJECT' for a user.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setLoading(false);
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/injection-plans/${userIdToInject}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setData(response.data.map(item => ({
                id: item.id,
                uid: item.user_id,
                order: item.injection_order,
                commission: `${item.commission_rate}%`,
                amount: item.injections_amount,
                completed: false, // This seems to be a placeholder, adjust as needed
                taskNumber: '',   // This seems to be a placeholder, adjust as needed
                completionTime: '', // This seems to be a placeholder, adjust as needed
                creationTime: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
            })));

        } catch (err) {
            console.error("Error fetching injection plans:", err);
            if (err.response) {
                if (err.response.status === 403) {
                    setError("Access Denied: You do not have administrator privileges.");
                } else if (err.response.status === 401) {
                    setError("Unauthorized: Please log in again.");
                    navigate('/login');
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

    useEffect(() => {
        fetchInjectionPlans();
    }, [userIdToInject, navigate]);

    // --- Handlers for table actions ---
    const handleEdit = (id) => {
        alert(`Edit clicked for ID: ${id}. This would open a form to edit the data.`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError("Authentication token not found. Please log in.");
                    navigate('/login');
                    return;
                }

                await axios.delete(`${API_BASE_URL}/injection-plans/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setData(data.filter(item => item.id !== id));
                alert('Injection plan deleted successfully!');
            } catch (err) {
                console.error("Error deleting injection plan:", err);
                setError(`Failed to delete injection plan: ${err.response?.data?.message || err.message}`);
                alert('Failed to delete injection plan. Check console for details.');
            }
        }
    };

    // --- Handlers for "Add Injection" modal ---
    const handleAdd = () => {
        setShowAddModal(true);
        setNewInjection({
            injection_order: '',
            commission_rate: 50.0,
            injections_amount: ''
        });
        setError(null);
        setSuccessMessage(null);
    };

    const handleNewInjectionChange = (e) => {
        const { name, value } = e.target;
        setNewInjection(prev => ({ ...prev, [name]: value }));
    };
    
    // ✅ **FIX APPLIED IN THIS FUNCTION**
    const handleNewInjectionSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!userIdToInject) {
            setError("Error: User ID is missing for the new injection plan.");
            return;
        }
        if (!newInjection.injection_order || !newInjection.injections_amount) {
            setError("Please fill in both Injection Order and Amount.");
            return;
        }

        const order = parseInt(newInjection.injection_order);
        const rate = parseFloat(newInjection.commission_rate);
        const amount = parseFloat(newInjection.injections_amount);

        if (isNaN(order) || order <= 0) {
            setError("Injection Order must be a positive number.");
            return;
        }
        if (isNaN(rate) || rate < 0) {
            setError("Commission Rate must be a non-negative number.");
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            setError("Injections Amount must be a positive number.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Authentication token not found. Please log in.");
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };
            
            // The user_id is no longer sent in the body. The backend will use the ID from the URL.
            const requestBody = {
                injection_order: order,
                commission_rate: rate,
                injections_amount: amount
            };

            const response = await axios.post(
                `${API_BASE_URL}/injection-plans/${userIdToInject}`,
                requestBody,
                config
            );

            setSuccessMessage(response.data.message || 'Injection plan added successfully!');
            setShowAddModal(false);
            fetchInjectionPlans();

            setNewInjection({
                injection_order: '',
                commission_rate: 50.0,
                injections_amount: ''
            });

        } catch (err) {
            console.error("Error adding injection plan:", err);
            // This will now correctly display the foreign key error if the backend issue persists
            setError(`Failed to add injection plan: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h2>UID: {userIdToInject || 'N/A'} Injection Plan</h2>
                <button className="add-button" onClick={handleAdd} disabled={!userIdToInject}>Add Injection</button>
            </div>

            {successMessage && <p className="success-message" style={{color: 'green', textAlign: 'center'}}>{successMessage}</p>}

            {loading ? (
                <p>Loading injection plans...</p>
            ) : error && !showAddModal ? ( // Only show main error if modal is closed
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
                                    <td colSpan="10">No injection plans found for this user.</td>
                                </tr>
                            ) : (
                                data.slice(0, rowsPerPage).map(item => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.uid}</td>
                                        <td>{item.order}</td>
                                        <td>{item.commission}</td>
                                        <td>{item.amount}</td>
                                        <td>
                                            <span className={item.completed ? "completed-label" : "unfinished-label"}>
                                                {item.completed ? "Completed" : "Unfinished"}
                                            </span>
                                        </td>
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
                <span>Total {Math.ceil(data.length / rowsPerPage)} page. Currently showing page 1.</span>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New Injection Plan for User ID: {userIdToInject}</h3>
                        {error && <p className="error-message">{error}</p>}
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
                                    min="1"
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
                                    min="0"
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
                                    min="0"
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