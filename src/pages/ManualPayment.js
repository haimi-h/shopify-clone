import React, { useState, useEffect } from 'react';
// import QRCode from 'qrcode.react';
import { QRCodeCanvas } from 'qrcode.react';

function ManualPayment() {
  const [paymentAddress, setPaymentAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaymentAddress = async () => {
      try {
        const response = await fetch('/api/payment/generate-address');
        const data = await response.json();
        if (data.address) {
          setPaymentAddress(data.address);
        } else {
          setError('Could not fetch payment address.');
        }
      } catch (err) {
        setError('Server connection error.');
      }
    };

    fetchPaymentAddress();
  }, []);

  return (
    <div>
      <h2>Pay with USDT (TRC20)</h2>
      {paymentAddress ? (
        <div>
          <p>Please send the payment to the following address:</p>
          <strong>{paymentAddress}</strong>
          <div style={{ marginTop: '20px' }}>
            {/* <QRCode value={paymentAddress} /> */}
            <QRCodeCanvas value={paymentAddress} />
          </div>
        </div>
      ) : (
        <p>Generating payment address...</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ManualPayment;