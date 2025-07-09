import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../InjectionPlan.css'; // Assuming you have this CSS file for styling

const API_BASE_URL = 'http://localhost:5000/api/injection-plans'; // Base URL for injection plan APIs

function InjectionPlan() {
    const { userIdToInject } = useParams(); // Get userId from URL params (e.g., /admin/injection/:userIdToInject)
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // State for modals/messages
    const [message, setMessage] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // Function to execute on confirm
    const [confirmMessage, setConfirmMessage] = useState('');

    // State for Add/Edit Modal
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null); // Null for add, object for edit

    // --- Utility Functions for Modals ---
    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    };

    const showConfirmation = (msg, action) => {
        setConfirmMessage(msg);
        setConfirmAction(() => action); // Store the function to be called on confirmation
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        if (confirmAction) {
            confirmAction();
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
    };

    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage('');
    };

    // --- API Calls ---
    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`${API_BASE_URL}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { userId: userIdToInject } // Pass userId as a query parameter if needed for filtering on backend
            });
            // Filter plans on frontend if backend getAll doesn't filter by userId in this context
            // Assuming the backend's getAllInjectionPlans already filters by req.user.id
            setPlans(response.data.filter(plan => plan.uid === parseInt(userIdToInject)));
        } catch (err) {
            console.error("Error fetching injection plans:", err);
            setError(err.response?.data?.message || 'Failed to fetch injection plans.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userIdToInject) {
            fetchPlans();
        } else {
            setError("User ID not provided for Injection Plan.");
            setLoading(false);
        }
    }, [userIdToInject, navigate]); // Re-fetch if userId changes

    const handleAdd = () => {
        setCurrentPlan(null); // Set to null for "add" mode
        setShowPlanModal(true);
    };

    const handleEdit = (plan) => {
        setCurrentPlan(plan); // Set to the plan object for "edit" mode
        setShowPlanModal(true);
    };

    const handleDelete = (id) => {
        showConfirmation('Are you sure you want to delete this injection plan?', async () => {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showMessage('Injection plan deleted successfully!');
                fetchPlans(); // Re-fetch to update the list
            } catch (err) {
                console.error("Error deleting injection plan:", err);
                showMessage(err.response?.data?.message || 'Failed to delete injection plan.');
            }
        });
    };

    const handleSavePlan = async (planData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            if (currentPlan) { // Edit existing plan
                await axios.put(`${API_BASE_URL}/${currentPlan.id}`, planData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showMessage('Injection plan updated successfully!');
            } else { // Add new plan
                await axios.post(API_BASE_URL, { ...planData, user_id: userIdToInject }, { // Pass user_id for new plan
                    headers: { Authorization: `Bearer ${token}` }
                });
                showMessage('Injection plan added successfully!');
            }
            setShowPlanModal(false);
            fetchPlans(); // Re-fetch to update the list
        } catch (err) {
            console.error("Error saving injection plan:", err);
            showMessage(err.response?.data?.message || 'Failed to save injection plan.');
        }
    };

    if (loading) {
        return <div className="container"><p>Loading injection plans...</p></div>;
    }

    if (error) {
        return <div className="container"><p className="error-message">Error: {error}</p></div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h2>UID: {userIdToInject} Injection Plan</h2>
                <button className="add-button" onClick={handleAdd}>Add Injection</button>
            </div>

            {message && <p className="info-message">{message}</p>}

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
                        {plans.length > 0 ? (
                            plans.slice(0, rowsPerPage).map(item => (
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
                                    <td>{item.completionTime ? new Date(item.completionTime).toLocaleString() : '-'}</td>
                                    <td>{item.creationTime ? new Date(item.creationTime).toLocaleString() : '-'}</td>
                                    <td><button className="edit-button" onClick={() => handleEdit(item)}>Edit</button></td>
                                    <td><button className="delete-button" onClick={() => handleDelete(item.id)}>Delete</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center' }}>No injection plans found for this user.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="footer">
                <span>Total {plans.length} records, displayed per page:</span>
                <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}>
                    {[5, 10, 20, 50].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <span>Total {Math.ceil(plans.length / rowsPerPage)} page(s). Currently showing page 1.</span>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <p>{confirmMessage}</p>
                        <div className="modal-actions">
                            <button onClick={handleConfirm} className="modal-button confirm-button">Confirm</button>
                            <button onClick={handleCancelConfirm} className="modal-button cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Plan Modal */}
            {showPlanModal && (
                <PlanModal
                    plan={currentPlan}
                    onSave={handleSavePlan}
                    onClose={() => setShowPlanModal(false)}
                />
            )}
        </div>
    );
}

// Separate component for the Add/Edit Plan Modal
const PlanModal = ({ plan, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        order: plan?.order || '',
        commission: plan?.commission || '',
        amount: plan?.amount || '',
        completed: plan?.completed || false,
        taskNumber: plan?.taskNumber || '',
        completionTime: plan?.completionTime ? new Date(plan.completionTime).toISOString().slice(0, 16) : '', // Format for datetime-local input
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{plan ? 'Edit Injection Plan' : 'Add New Injection Plan'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Injection Order:</label>
                        <input type="number" name="order" value={formData.order} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Commission Rate:</label>
                        <input type="text" name="commission" value={formData.commission} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Injections Amount:</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" required />
                    </div>
                    <div className="form-group checkbox-group">
                        <label>Completed:</label>
                        <input type="checkbox" name="completed" checked={formData.completed} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Task Order Number:</label>
                        <input type="text" name="taskNumber" value={formData.taskNumber} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Completion Time:</label>
                        <input type="datetime-local" name="completionTime" value={formData.completionTime} onChange={handleChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="modal-button confirm-button">Save</button>
                        <button type="button" onClick={onClose} className="modal-button cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InjectionPlan;