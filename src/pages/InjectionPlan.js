import React, { useState } from 'react';
import '../InjectionPlan.css';

const initialData = [
  { id: '54745', uid: '44128', order: 15, commission: '50%', amount: 0, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:12:06' },
  { id: '54746', uid: '44128', order: 16, commission: '50%', amount: 46, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:12:24' },
  { id: '54747', uid: '44128', order: 17, commission: '50%', amount: 0, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:12:42' },
  { id: '54748', uid: '44128', order: 18, commission: '50%', amount: 88, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:13:04' },
  { id: '54749', uid: '44128', order: 19, commission: '50%', amount: 166, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:13:16' },
  { id: '54750', uid: '44128', order: 20, commission: '50%', amount: 288, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:13:30' },
  { id: '54751', uid: '44128', order: 47, commission: '50%', amount: 366, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:13:44' },
  { id: '54752', uid: '44128', order: 49, commission: '50%', amount: 1331, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:13:57' },
  { id: '54753', uid: '44128', order: 50, commission: '50%', amount: 2666, completed: false, taskNumber: '', completionTime: '', creationTime: '2024-12-24 21:14:11' },
];

function InjectionPlan() {
  const [data, setData] = useState(initialData);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const handleEdit = (id) => {
    alert(`Edit clicked for ID: ${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setData(data.filter(item => item.id !== id));
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2>UID: 44128 Injection Plan</h2>
        <button className="add-button">Add Injection</button>
      </div>

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
            {data.slice(0, rowsPerPage).map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.uid}</td>
                <td>{item.order}</td>
                <td>{item.commission}</td>
                <td>{item.amount}</td>
                <td><span className="unfinished-label">Unfinished</span></td>
                <td>{item.taskNumber || '-'}</td>
                <td>{item.completionTime || '-'}</td>
                <td>{item.creationTime}</td>
                <td><button className="edit-button" onClick={() => handleEdit(item.id)}>Edit</button></td>
                <td><button className="delete-button" onClick={() => handleDelete(item.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <span>Total {data.length} records, displayed per page:</span>
        <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}>
          {[5, 10, 20, 50].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <span>Total 1 page. Currently showing page 1.</span>
      </div>
    </div>
  );
}

export default InjectionPlan;
