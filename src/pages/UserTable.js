import React, { useState, useEffect } from 'react';
import '../UserTable.css'; // Your existing CSS file
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls

// Import new modal components - FIX: Adjusted paths based on your file structure
import HistoryModal from './admin/HistoryModal'; // UserTable is in src/pages, Modals are in src/pages/admin
import SettingModal from './admin/SettingModal'; // UserTable is in src/pages, Modals are in src/pages/admin

// const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const UserTable = () => {
    const [users, setUsers] = useState([]); // Initialize with empty array, data will come from backend
    const [filters, setFilters] = useState({ username: '', phone: '', code: '', wallet: '' });
    const [loading, setLoading] = useState(true); // New state for loading status
    const [error, setError] = useState(null); // New state for error messages

    // Updated state for "APPLY" functionality: now an array for multiple selections
    const [tasksToApply, setTasksToApply] = useState(''); // For the input field value
    const [selectedUserIds, setSelectedUserIds] = useState([]); // Changed to an array for multiple selections

    // States for History and Setting Modals
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showSettingModal, setShowSettingModal] = useState(false);
    const [selectedUserForModal, setSelectedUserForModal] = useState(null); // Stores the user object for the modal

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
                navigate('/login'); // Redirect to the general login page
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
                navigate('/login'); // Redirect to the general login page
            }
        } finally {
            setLoading(false);
        }
    };

    // useEffect to fetch users when the component mounts
    useEffect(() => {
        fetchUsers();
    }, [navigate]);

    // Handler for filter input changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    // Filter users based on input values (now applied to fetched data)
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(filters.username.toLowerCase()) &&
        user.phone.includes(filters.phone) &&
        user.invitation_code.toLowerCase().includes(filters.code.toLowerCase()) &&
        // Handle wallet_balance filtering safely, assuming it's a string or can be converted
        (user.wallet_balance ? user.wallet_balance.toString().toLowerCase().includes(filters.wallet.toLowerCase()) : false)
    );

    // Handle checkbox change for multiple selections
    const handleCheckboxChange = (userId) => {
        setSelectedUserIds(prevSelected => {
            const newSelected = prevSelected.includes(userId)
                ? prevSelected.filter(id => id !== userId) // Deselect
                : [...prevSelected, userId]; // Select
            // console.log('[UserTable - handleCheckboxChange] New selectedUserIds:', newSelected); // DEBUG LOG
            return newSelected;
        });
    };

    // --- Action Handlers for existing buttons ---
    const handleInject = (userId) => {
        // PRESERVED: Navigate to the InjectionPlan page, passing the userId as state
        navigate('/admin/injection', { state: { userIdToInject: userId } });
    };

    // NEW: Handle History button click - Pass the whole user object
    const handleHistory = (user) => { // Pass the entire user object
        setSelectedUserForModal(user);
        setShowHistoryModal(true);
    };

    // NEW: Handle Setting button click - Pass the whole user object
    const handleSetting = (user) => { // Pass the entire user object
        setSelectedUserForModal(user);
        setShowSettingModal(true);
    };

    const handleCreate = () => {
        console.log('Initiating new user creation');
        window.alert('Implement new user creation functionality.');
    };

    // --- New Action Handler for "Apply Daily Tasks" ---
    const handleApplyDailyTasks = async () => {
        // console.log('[UserTable - handleApplyDailyTasks] APPLY button clicked.'); // DEBUG LOG
        // console.log('[UserTable - handleApplyDailyTasks] Selected User IDs at click:', selectedUserIds); // DEBUG LOG
        // console.log('[UserTable - handleApplyDailyTasks] Tasks to Apply:', tasksToApply); // DEBUG LOG

        if (selectedUserIds.length === 0) {
            window.alert("Please select at least one user to apply tasks to.");
            // console.log('[UserTable - handleApplyDailyTasks] No users selected. Aborting.'); // DEBUG LOG
            return;
        }
        if (!tasksToApply || isNaN(tasksToApply) || parseInt(tasksToApply) < 0) {
            window.alert("Please enter a valid non-negative number of tasks.");
            // console.log('[UserTable - handleApplyDailyTasks] Invalid tasksToApply. Aborting.'); // DEBUG LOG
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // console.warn('[UserTable - handleApplyDailyTasks] No token found. Redirecting to login.'); // DEBUG LOG
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

            const parsedTasksToApply = parseInt(tasksToApply);
            // console.log(`[UserTable - handleApplyDailyTasks] Sending PUT request for ${selectedUserIds.length} users with daily_orders: ${parsedTasksToApply}`); // DEBUG LOG

            // CRITICAL CHECK: Ensure selectedUserIds is not empty here
            if (selectedUserIds.length === 0) {
                console.error('[UserTable - handleApplyDailyTasks] ERROR: selectedUserIds is unexpectedly empty right before sending requests.');
                window.alert('An internal error occurred: No users selected for update.');
                return;
            }

            const promises = selectedUserIds.map(userId => {
                const url = `${API_BASE_URL}/admin/users/${userId}`;
                const data = { daily_orders: parsedTasksToApply };
                // console.log(`[UserTable - handleApplyDailyTasks] Requesting: PUT ${url} with data:`, data); // DEBUG LOG
                return axios.put(url, data, config);
            });

            await Promise.all(promises); // Wait for all updates to complete

            window.alert(`Daily tasks applied successfully to ${selectedUserIds.length} user(s).`);
            // console.log('[UserTable - handleApplyDailyTasks] All PUT requests successful. Re-fetching users.'); // DEBUG LOG
            fetchUsers(); // Re-fetch all users to get updated data after applying tasks
            setTasksToApply('');
            setSelectedUserIds([]); // Clear selection after successful application

        } catch (err) {
                console.error('[UserTable - handleApplyDailyTasks] Error applying daily tasks:', err); // DEBUG LOG
            window.alert(err.response?.data?.message || 'Failed to apply daily tasks.');
            // If unauthorized, clear token and redirect to login
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    };

    // Callback for when settings are saved in the SettingModal
    const handleSettingsSaved = () => {
        setShowSettingModal(false); // Close the modal
        fetchUsers(); // Re-fetch users to update the table with new data
        // Optionally show a success message
        // window.alert('User settings updated successfully!');
    };

    // Determine if the APPLY button should be disabled
    const isApplyButtonDisabled = selectedUserIds.length === 0 ||
                                 !tasksToApply ||
                                 isNaN(parseInt(tasksToApply)) ||
                                 parseInt(tasksToApply) < 0;


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
                    {/* Add disabled attribute to the APPLY button */}
                    <button onClick={handleApplyDailyTasks} className="btn btn-apply" disabled={isApplyButtonDisabled}>APPLY</button>
                </div>
            </div>

            {/* Wrap the table in a responsive div */}
            <div className="table-responsive-wrapper">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th></th> {/* For checkbox/selection */}
                            <th>#</th>
                            <th>Username</th>
                            <th>Phone No</th>
                            <th>Invitation Code</th>
                            <th>Invited By</th>
                            <th>Daily Orders</th>
                            <th>Completed</th>
                            <th>Uncompleted</th>
                            <th>Wallet</th> {/* This header is for the wallet address */}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => (
                                <tr key={user.id} className={selectedUserIds.includes(user.id) ? 'selected-row' : ''}> {/* Highlight selected rows */}
                                    <td>
                                        {/* Changed to checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => handleCheckboxChange(user.id)}
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
                                    <td>{user.wallet_balance || 'N/A'}</td> {/* Display wallet_balance directly as string */}
                                    <td className="actions">
                                        <button className="btn btn-red" onClick={() => handleInject(user.id)}>INJECT</button>
                                        {/* Corrected: Pass the full user object to handleHistory and handleSetting */}
                                        <button className="btn btn-blue" onClick={() => handleHistory(user)}>HISTORY</button>
                                        <button className="btn btn-yellow" onClick={() => handleSetting(user)}>SETTING</button>
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
            </div> {/* End of table-responsive-wrapper */}

            <div className="pagination">
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <button>+</button>
                <button>5</button>
            </div>

            {/* History Modal */}
            {showHistoryModal && selectedUserForModal && (
                <HistoryModal
                    user={selectedUserForModal}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}

            {/* Setting Modal */}
            {showSettingModal && selectedUserForModal && (
                <SettingModal
                    user={selectedUserForModal}
                    onClose={() => setShowSettingModal(false)}
                    onSave={handleSettingsSaved} // Callback to re-fetch users after save
                />
            )}
        </div>
    );
};

export default UserTable;
