import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation
import axios from 'axios'; // Make sure you import axios here

const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API base URL

const InjectionPlan = () => {
    const location = useLocation(); // Get the location object
    const navigate = useNavigate();

    // Destructure userIdToInject from location.state
    // Provide a default empty object to prevent errors if state is null/undefined
    const { userIdToInject } = location.state || {};

    // State for your form inputs (injection_order, commission_rate, injections_amount)
    const [injectionOrder, setInjectionOrder] = useState('');
    const [commissionRate, setCommissionRate] = useState('50'); // Example default
    const [injectionsAmount, setInjectionsAmount] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        // Optional: Check if userIdToInject is present, otherwise redirect
        if (!userIdToInject) {
            console.warn("No user ID found in location state. Redirecting to user table.");
            navigate('/admin/users'); // Redirect back if no user is selected
        } else {
            console.log("InjectionPlan component received userId:", userIdToInject);
        }
    }, [userIdToInject, navigate]); // Add navigate to dependency array

    // --- The `handleSubmit` function where the API call is made ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setSuccessMessage(null); // Clear previous success messages

        if (!userIdToInject) {
            setError("Cannot create injection plan: No user ID provided.");
            return;
        }
        if (!injectionOrder || !injectionsAmount) {
            setError("Please fill in Injection Order and Injections Amount.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in as an administrator.');
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios.post(
                // Use the dynamic userIdToInject in the URL
                `${API_BASE_URL}/injection-plans/${userIdToInject}`,
                {
                    user_id: userIdToInject, // Although in params, send in body for clarity if backend expects
                    injection_order: parseInt(injectionOrder),
                    commission_rate: parseFloat(commissionRate),
                    injections_amount: parseFloat(injectionsAmount),
                },
                config
            );

            setSuccessMessage(response.data.message || 'Injection plan created successfully!');
            // Optional: Clear form or redirect after success
            setInjectionOrder('');
            setCommissionRate('50');
            setInjectionsAmount('');
            // navigate('/admin/users'); // Example: redirect back to user table
        } catch (err) {
            console.error("Error creating injection plan from frontend:", err);
            setError(err.response?.data?.message || 'Failed to create injection plan.');
        }
    };

    return (
        <div className="injection-plan-container">
            <h2>Create Injection Plan for User ID: {userIdToInject}</h2>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <form onSubmit={handleSubmit}>
                {/* Your form fields */}
                <div className="form-group">
                    <label>Injection Order:</label>
                    <input
                        type="number"
                        value={injectionOrder}
                        onChange={(e) => setInjectionOrder(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Commission Rate (%):</label>
                    <input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        min="0"
                        step="0.01"
                    />
                </div>
                <div className="form-group">
                    <label>Injections Amount:</label>
                    <input
                        type="number"
                        value={injectionsAmount}
                        onChange={(e) => setInjectionsAmount(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>
                <button type="submit" className="btn btn-primary">Create Injection Plan</button>
            </form>
        </div>
    );
};

export default InjectionPlan;