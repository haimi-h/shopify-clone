import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReferralComponent = () => {
  const [invitationCode, setInvitationCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
          withCredentials: true,
        });

        setInvitationCode(profileResponse.data.invitation_code);

        const referralResponse = await axios.get(`${BASE_URL}/api/user/my-referrals`, {
          withCredentials: true,
        });

        setReferrals(referralResponse.data.referrals);
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🎉 Invite Friends</h2>

      <div style={styles.box}>
        <p>Your Referral Code:</p>
        <div style={styles.row}>
          <input
            type="text"
            value={invitationCode}
            readOnly
            style={styles.input}
          />
          <button onClick={handleCopy} style={styles.button}>
            {copied ? '✅ Copied' : 'Copy'}
          </button>
        </div>
        <p style={styles.linkText}>
          Referral Link: <br />
          <span style={styles.refLink}>https://yourdomain.com/register?ref={invitationCode}</span>
        </p>
      </div>

      <div>
        <h3>👥 Your Referrals</h3>
        {referrals.length === 0 ? (
          <p>No referrals yet.</p>
        ) : (
          <ul>
            {referrals.map(ref => (
              <li key={ref.id} style={styles.listItem}>
                <strong>{ref.username}</strong> — {ref.phone_number} <br />
                Joined: {new Date(ref.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 600,
    margin: '2rem auto',
    padding: '1.5rem',
    border: '1px solid #ccc',
    borderRadius: 12,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fefefe',
  },
  header: {
    textAlign: 'center',
    color: '#333',
  },
  box: {
    marginBottom: '2rem',
    padding: '1rem',
    background: '#f9f9f9',
    borderRadius: 8,
  },
  row: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: 6,
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  linkText: {
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
  refLink: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  listItem: {
    marginBottom: '1rem',
    borderBottom: '1px solid #eee',
    paddingBottom: '0.5rem',
  },
};

export default ReferralComponent;
