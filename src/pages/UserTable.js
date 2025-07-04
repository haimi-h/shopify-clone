import React, { useState } from 'react';
import '../UserTable.css';
import { useNavigate } from 'react-router-dom';

const usersData = [
  { id: 6, username: 'Muhammad', phone: '946320296', code: 'HO6JT', inviter: 'LEO', orders: 0, completed: 0, uncompleted: 0, wallet: '', history: '', settings: '', create: '' },
  { id: 5, username: 'Kim3', phone: '921019298', code: 'TQQ116', inviter: 'Abdella', orders: 40, completed: 40, uncompleted: 0, wallet: '', history: '', settings: '', create: '' },
  { id: 4, username: 'Abdella', phone: '745879658', code: 'KNML7J', inviter: 'LEO', orders: 40, completed: 19, uncompleted: 11, wallet: 'T2QRS--', history: '', settings: '', create: '' },
  { id: 3, username: 'Kim2', phone: '921070010', code: 'RNJ0AB', inviter: 'Muha', orders: 40, completed: 40, uncompleted: 0, wallet: 'THEOGSLIGH--', history: '', settings: '', create: '' },
  { id: 2, username: 'Musa', phone: '921078890', code: 'QMJ0AD', inviter: 'KIM', orders: '60', completed: '20', uncompleted: '40', wallet: 'EHGOGSLI--', history: '', settings: '', create: '' },
  { id: 1, username: 'Kumt', phone: '985879655', code: 'HNNL7J', inviter: 'Abdella', orders: '40', completed: '19', uncompleted: '11', wallet: '', history: '', settings: '', create: '' },
];

const UserTable = () => {
  const [users, setUsers] = useState(usersData);
  const [filters, setFilters] = useState({ username: '', phone: '', code: '', wallet: '' });
  const navigate = useNavigate();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(filters.username.toLowerCase()) &&
    user.phone.includes(filters.phone) &&
    user.code.toLowerCase().includes(filters.code.toLowerCase()) &&
    user.wallet.toLowerCase().includes(filters.wallet.toLowerCase())
  );

  return (
    <div className="user-table-container">
      <h2 className="table-title">User Table</h2>
      <div className="filters">
        <input name="username" placeholder="Username" onChange={handleFilterChange} />
        <input name="phone" placeholder="Phone No" onChange={handleFilterChange} />
        <input name="code" placeholder="Invitation Code" onChange={handleFilterChange} />
        <input name="wallet" placeholder="Wallet Address" onChange={handleFilterChange} />
      </div>
      <table className="user-table">
        <thead>
          <tr>
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
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.phone}</td>
              <td>{user.code}</td>
              <td>{user.inviter}</td>
              <td>{user.orders}</td>
              <td>{user.completed}</td>
              <td>{user.uncompleted}</td>
              <td>{user.wallet}</td>
              <td className="actions">
                <button className="btn btn-red" onClick={() => navigate('/admin/injection')}>INJECT</button>
                <button className="btn btn-blue">HISTORY</button>
                <button className="btn btn-yellow">SETTING</button>
                <button className="btn btn-green">CREATE</button>
              </td>
            </tr>
          ))}
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