import { useState, useEffect } from 'react';

let toasts = [];
let listeners = [];

const notify = (message, type = 'success') => {
  const id = Date.now();
  toasts = [...toasts, { id, message, type }];
  listeners.forEach(l => l([...toasts]));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l([...toasts]));
  }, 3500);
};

export const toast = {
  success: (msg) => notify(msg, 'success'),
  error: (msg) => notify(msg, 'error'),
};

export function ToastContainer() {
  const [list, setList] = useState([]);
  useEffect(() => {
    listeners.push(setList);
    return () => { listeners = listeners.filter(l => l !== setList); };
  }, []);

  return (
    <div className="toast-container">
      {list.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
