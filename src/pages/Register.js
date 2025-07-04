// // Register.jsx
// import React, { useState } from 'react';
// import '../Auth.css';
// import { Link, useNavigate } from 'react-router-dom';

// function Register() {
//   const [formData, setFormData] = useState({
//     username: '',
//     phone_number: '',
//     password: '',
//     password_confirmation: '',
//     withdrawal_password: '',
//     invitation_code: ''
//   });

//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value
//     }));
//   };

//   const handleSubmit = () => {
//     setError('');

//     if (
//       !formData.username ||
//       !formData.phone_number ||
//       !formData.password ||
//       !formData.password_confirmation
//     ) {
//       setError('Please fill all required fields.');
//       return;
//     }

//     if (formData.password !== formData.password_confirmation) {
//       setError('Passwords do not match.');
//       return;
//     }

//     const users = JSON.parse(localStorage.getItem('users') || '[]');

//     if (users.some(u => u.phone_number === formData.phone_number)) {
//       setError('Phone number already registered.');
//       return;
//     }

//     const newUser = {
//       username: formData.username,
//       phone_number: formData.phone_number,
//       password: formData.password,
//       withdrawal_password: formData.withdrawal_password,
//       invitation_code: formData.invitation_code,
//     };

//     users.push(newUser);
//     localStorage.setItem('users', JSON.stringify(users));

//     alert('Registration successful!');
//     navigate('/login');
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h2 className="brand-name">Registration to</h2>
//         <p className="tagline">Create your account</p>

//         {error && <p className="error-message">{error}</p>}

//         <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleChange} className="auth-input" />
//         <input type="text" placeholder="Phone number" name="phone_number" value={formData.phone_number} onChange={handleChange} className="auth-input" />
//         <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="auth-input" />
//         <input type="password" placeholder="Confirm password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className="auth-input" />
//         <input type="password" placeholder="Withdrawal password" name="withdrawal_password" value={formData.withdrawal_password} onChange={handleChange} className="auth-input" />
//         <input type="text" placeholder="Invitation Code" name="invitation_code" value={formData.invitation_code} onChange={handleChange} className="auth-input" />

//         <button className="auth-button" onClick={handleSubmit}>REGISTER</button>
//         <Link to="/login" className="auth-link">Back to Login</Link>
//       </div>
//     </div>
//   );
// }

// export default Register;
import React, { useState } from 'react';
import '../Auth.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api/auth';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirm_password: '',
    withdrawal_password: '',
    invitation_code: '',
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    const {
      username,
      phone,
      password,
      confirm_password,
      withdrawal_password,
      invitation_code,
    } = formData;

    if (!username || !phone || !password || !confirm_password) {
      setError('Please fill all required fields.');
      return;
    }

    if (password !== confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await axios.post(`${API}/signup`, {
        username,
        phone,
        password,
        confirm_password,
        withdrawal_password,
        invitation_code,
      });

      setMessage(res.data.message || 'Registration successful!');
      alert('Registered successfully!');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="brand-name">Registration to</h2>
        <p className="tagline">Create your account</p>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleChange} className="auth-input" />
        <input type="text" placeholder="Phone number" name="phone" value={formData.phone} onChange={handleChange} className="auth-input" />
        <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="auth-input" />
        <input type="password" placeholder="Confirm password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="auth-input" />
        <input type="password" placeholder="Withdrawal password" name="withdrawal_password" value={formData.withdrawal_password} onChange={handleChange} className="auth-input" />
        <input type="text" placeholder="Invitation Code" name="invitation_code" value={formData.invitation_code} onChange={handleChange} className="auth-input" />

        <button className="auth-button" onClick={handleSubmit}>REGISTER</button>
        <Link to="/login" className="auth-link">Back to Login</Link>
      </div>
    </div>
  );
}

export default Register;
