import React, { useState, useEffect } from 'react';
import '../UserTable.css'; // Your existing CSS file
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls

const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API base URL

const UserTable = () => {
    const [users, setUsers] = useState([]); // Initialize with empty array, data will come from backend
    const [filters, setFilters] = useState({ username: '', phone: '', code: '', wallet: '' });
    const [loading, setLoading] = useState(true); // New state for loading status
    const [error, setError] = useState(null); // New state for error messages

    // New states for the "40 APPLY" functionality
    const [tasksToApply, setTasksToApply] = useState(''); // For the input field value
    const [selectedUserId, setSelectedUserId] = useState(null); // To track which user's radio button is selected

    const navigate = useNavigate();

    // Function to fetch users from the backend
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors

            const token = localStorage.getItem('token'); // Get the JWT token from local storage
            if (!token) {
                setError('Authentication required. Please log in as an administrator.');
                setLoading(false);
                navigate('/admin-login'); // Redirect to admin login if no token
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`, // Include the token in the request header
                },
            };
            // Make a GET request to your backend admin users endpoint
            const response = await axios.get(`${API_BASE_URL}/admin/users`, config);
            setUsers(response.data); // Set the fetched users to state
        } catch (err) {
            console.error('Error fetching users for admin table:', err);
            setError(err.response?.data?.message || 'Failed to fetch users. Please ensure the backend is running and you are logged in as admin.');
            // Handle unauthorized access (e.g., if token is invalid or user is not admin)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user'); // Also clear user data if stored
                navigate('/admin-login'); // Redirect to admin login
            }
        } finally {
            setLoading(false);
        }
    };

    // useEffect to fetch users when the component mounts
    useEffect(() => {
        fetchUsers();
    }, [navigate]); // navigate is a dependency to ensure effect runs if navigation changes (though less common here)

    // Handler for filter input changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    // Filter users based on input values (now applied to fetched data)
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(filters.username.toLowerCase()) &&
        user.phone.includes(filters.phone) &&
        user.invitation_code.toLowerCase().includes(filters.code.toLowerCase()) && // Use invitation_code
        user.wallet_balance.toString().toLowerCase().includes(filters.wallet.toLowerCase()) // Use wallet_balance
    );

    // --- Action Handlers for existing buttons ---
    const handleInject = async (userId) => {
        const amount = prompt("Enter amount to inject:");
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert("Please enter a valid positive number.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };
            const res = await axios.post(`${API_BASE_URL}/admin/users/inject/${userId}`, { amount: parseFloat(amount) }, config);
            alert(res.data.message);
            // Update the user's wallet balance in the local state for immediate UI refresh
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, wallet_balance: user.wallet_balance + parseFloat(amount) } : user
            ));
        } catch (err) {
            console.error('Error injecting wallet:', err);
            alert(err.response?.data?.message || 'Failed to inject wallet balance.');
        }
    };

    const handleHistory = (userId) => {
        console.log(`Viewing history for user ID: ${userId}`);
        alert(`Implement history view for user ID: ${userId}`);
        // Example: navigate(`/admin/users/${userId}/history`);
    };

    const handleSetting = (userId) => {
        console.log(`Setting for user ID: ${userId}`);
        alert(`Implement setting functionality for user ID: ${userId}`);
        // Example: navigate(`/admin/users/${userId}/edit`);
    };

    // This "CREATE" button should ideally be a global action, not per row
    const handleCreate = () => {
        console.log('Initiating new user creation');
        alert('Implement new user creation functionality.');
        // Example: navigate('/admin/users/new');
    };

    // --- New Action Handler for "Apply Daily Tasks" ---
    const handleApplyDailyTasks = async () => {
        if (selectedUserId === null) {
            alert("Please select a user to apply tasks to.");
            return;
        }
        if (!tasksToApply || isNaN(tasksToApply) || parseInt(tasksToApply) < 0) {
            alert("Please enter a valid non-negative number of tasks.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };
            // Send a PUT request to update the user's daily_orders
            const res = await axios.put(`${API_BASE_URL}/admin/users/${selectedUserId}`, {
                daily_orders: parseInt(tasksToApply)
            }, config);

            alert(res.data.message);
            // Update the user's daily_orders in the local state for immediate UI refresh
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === selectedUserId ? { ...user, daily_orders: parseInt(tasksToApply) } : user
            ));
            // Optionally, clear the input and selection after successful application
            setTasksToApply('');
            setSelectedUserId(null);

        } catch (err) {
            console.error('Error applying daily tasks:', err);
            alert(err.response?.data?.message || 'Failed to apply daily tasks.');
        }
    };

    // Display loading or error messages
    if (loading) return <p className="loading-message">Loading users...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="user-table-container">
            <h2 className="table-title">User Table</h2>

            {/* Filters and new "Apply Tasks" section */}
            <div className="filters">
                <input name="username" placeholder="Username" onChange={handleFilterChange} value={filters.username} />
                <input name="phone" placeholder="Phone No" onChange={handleFilterChange} value={filters.phone} />
                <input name="code" placeholder="Invitation Code" onChange={handleFilterChange} value={filters.code} />
                <input name="wallet" placeholder="Wallet Address" onChange={handleFilterChange} value={filters.wallet} />

                {/* "40 APPLY" section */}
                <div className="apply-tasks-section">
                    <input
                        type="number"
                        placeholder="Tasks"
                        value={tasksToApply}
                        onChange={(e) => setTasksToApply(e.target.value)}
                        min="0"
                        className="tasks-input"
                    />
                    <button onClick={handleApplyDailyTasks} className="btn btn-apply">APPLY</button>
                </div>
            </div>

            <table className="user-table">
                <thead>
                    <tr>
                        <th></th> {/* For radio button/selection */}
                        <th>#</th>
                        <th>Username</th>
                        <th>Phone No</th>
                        <th>Invitation Code</th>
                        <th>Invited By</th>
                        <th>Daily Orders</th>
                        <th>Completed</th>
                        <th>Uncompleted</th>
                        <th>Wallet</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                            <tr key={user.id} className={selectedUserId === user.id ? 'selected-row' : ''}>
                                <td>
                                    <input
                                        type="radio"
                                        name="selectUser" // Group radio buttons by name
                                        checked={selectedUserId === user.id}
                                        onChange={() => setSelectedUserId(user.id)}
                                    />
                                </td>
                                <td>{index + 1}</td> {/* Use index + 1 for row number */}
                                <td>{user.username}</td>
                                <td>{user.phone}</td>
                                <td>{user.invitation_code}</td> {/* Backend field name */}
                                <td>{user.invited_by || 'N/A'}</td> {/* Backend field name, default 'N/A' */}
                                <td>{user.daily_orders}</td> {/* Backend field name */}
                                <td>{user.completed_orders}</td> {/* Backend field name */}
                                <td>{user.uncompleted_orders}</td> {/* Backend field name */}
                                <td>{user.wallet_balance ? user.wallet_balance.toFixed(2) : '0.00'}</td> {/* Backend field name, format as currency */}
                                <td className="actions">
                                    <button className="btn btn-red" onClick={() => handleInject(user.id)}>INJECT</button>
                                    <button className="btn btn-blue" onClick={() => handleHistory(user.id)}>HISTORY</button>
                                    <button className="btn btn-yellow" onClick={() => handleSetting(user.id)}>SETTING</button>
                                    {/* The CREATE button is typically for adding a new user globally, not per row.
                                        Consider moving it outside the table if that's its intended function.
                                        For now, keeping it here but calling a global handler. */}
                                    <button className="btn btn-green" onClick={handleCreate}>CREATE</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="11" style={{ textAlign: 'center' }}>No users found or matching filters.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="pagination">
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <button>+</button>
                <button>5</button>
            </div>
        </div>
    );
};

export default UserTable;
