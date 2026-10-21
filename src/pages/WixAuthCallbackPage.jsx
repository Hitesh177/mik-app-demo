import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { api } from '../lib/api';

export default function WixAuthCallbackPage() {
  const navigate = useNavigate();
  const { setCustomer, setOrders } = useCustomer();
  const [message, setMessage] = useState('Completing your Wix sign-in...');
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const code = hashParams.get('code') || queryParams.get('code');
    const state = hashParams.get('state') || queryParams.get('state');
    if (!code || !state) { setMessage('Wix did not return a sign-in code.'); return; }
    api.finishWixLogin(code, state)
      .then(result => {
        setCustomer(result.customer || null);
        setOrders(Array.isArray(result.orders) ? result.orders : []);
        setMessage('Wix account connected.');
        window.setTimeout(() => navigate('/account', { replace: true }), 500);
      })
      .catch(error => setMessage(error.message || 'Wix sign-in failed.'));
  }, [navigate, setCustomer, setOrders]);
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><p className="rounded-2xl bg-white px-6 py-5 text-slate-700 shadow-sm">{message}</p></main>;
}
