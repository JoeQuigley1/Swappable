import React from 'react';

export default function SwapActions({ swapId }) {
  const handleSwapAction = async (action) => {
    try {
      const response = await fetch(`http://localhost:8080/api/swaps/${swapId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} swap`);
      }

      alert(`Swap successfully ${action}ed!`);
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing request');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button
        onClick={() => handleSwapAction('accept')}
        style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', cursor: 'pointer' }}
      >
        Accept
      </button>
      <button
        onClick={() => handleSwapAction('decline')}
        style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', cursor: 'pointer' }}
      >
        Decline
      </button>
    </div>
  );
}