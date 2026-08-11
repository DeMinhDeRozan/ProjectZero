import { useState, useEffect } from 'react';

const cover_type = ['Single', 'Couple', 'Family'];
const cover_history = ['Yes', 'No', 'Not Sure'];
const hos_cl = ['None', 'Basic', 'Bronze', 'Silver', 'Gold'];
const ext_cl = ['None', 'Basic', 'Standard', 'Premium'];
const pay_freq = ['Monthly', 'Yearly'];

function checkQuoteData(data) {
  if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim() === '') {
    return 'Customer name is required.';
  }
  let regex = /\d/;
  if (regex.test(data.customer_name)) {
    return 'Customer name cannot contain numbers.';
  }
  if (!cover_type.includes(data.cover_type)) {
    return 'Invalid cover type.';
  }
  if (typeof data.app1_age !== 'number' || isNaN(data.app1_age) || data.app1_age < 18 || data.app1_age > 100) {
    return 'Applicant 1 age must be a number between 18 and 100.';
  }
  if (!cover_history.includes(data.app1_hch)) {
    return 'Invalid applicant 1 health cover history.';
  }
  if (data.cover_type !== 'Single') {
    if (typeof data.app2_age !== 'number' || isNaN(data.app2_age) || data.app2_age < 18 || data.app2_age > 100) {
      return 'Applicant 2 age must be a number between 18 and 100 for Couple or Family cover.';
    }
    if (!cover_history.includes(data.app2_hch)) {
      return 'Invalid applicant 2 health cover history for Couple or Family cover.';
    }
  }
  if (!hos_cl.includes(data.hos_cl)) {
    return 'Invalid hospital cover level.';
  }
  if (!ext_cl.includes(data.ext_cl)) {
    return 'Invalid extras cover level.';
  }
  if (!pay_freq.includes(data.pay_freq)) {
    return 'Invalid payment frequency.';
  }
  if (data.pay_freq !== 'Monthly') {
    if (typeof data.ann_discount !== 'number' || isNaN(data.ann_discount) || data.ann_discount < 0 || data.ann_discount > 10) {
      return 'Annual discount must be a number between 0 and 10 for yearly payment frequency.';
    }
  }
  return null; 
}

export default function App() {
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState({
    customer_name: '',
    cover_type: 'Single',
    app1_age: 30,
    app1_hch: 'Yes',
    app2_age: '',
    app2_hch: 'Yes',
    hos_cl: 'Bronze',
    ext_cl: 'Standard',
    pay_freq: 'Monthly',
    ann_discount: 0,
    notes: ''
  });
  
  const [editingId, setEditingId] = useState(null);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchQuotes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/quote');
      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      console.error("Error fetching quotes:", err);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pay_freq') {
      setForm({
        ...form,
        pay_freq: value,
        ann_discount: value === 'Monthly' ? 0 : form.ann_discount
      });
      return;
    }
    setForm({
      ...form,
      [name]: name.includes('_age') || name === 'ann_discount' 
        ? (value === '' ? '' : Number(value)) 
        : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = checkQuoteData(form);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const url = editingId ? `http://localhost:3001/api/quote/${editingId}` : 'http://localhost:3001/api/quote';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong');
        return;
      }

      setForm({
        customer_name: '',
        cover_type: 'Single',
        app1_age: 30,
        app1_hch: 'Yes',
        app2_age: '',
        app2_hch: 'Yes',
        hos_cl: 'Bronze',
        ext_cl: 'Standard',
        pay_freq: 'Monthly',
        ann_discount: 0,
        notes: ''
      });
      setEditingId(null);
      fetchQuotes();
    } catch (err) {
      setErrorMsg('Server connection error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quote?")) return;
    try {
      const res = await fetch(`http://localhost:3001/api/quote/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchQuotes();
        if (selectedQuoteDetail?.id === id) setSelectedQuoteDetail(null);
      }
    } catch (err) {
      console.error("Error deleting quote:", err);
    }
  };

  const handleEditClick = (quote) => {
    setEditingId(quote.id);
    setForm({
      customer_name: quote.customer_name,
      cover_type: quote.cover_type,
      app1_age: quote.app1_age,
      app1_hch: quote.app1_hch,
      app2_age: quote.app2_age || '',
      app2_hch: quote.app2_hch || 'Yes',
      hos_cl: quote.hos_cl,
      ext_cl: quote.ext_cl,
      pay_freq: quote.pay_freq,
      ann_discount: quote.ann_discount || 0,
      notes: quote.notes || ''
    });
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/quote/${id}`);
      const data = await res.json();
      setSelectedQuoteDetail(data);
    } catch (err) {
      console.error("Error fetching detail:", err);
    }
  };

  return (
    <div className="container">
      <h2>Health Cover System (HCS) - Dashboard</h2>

      {errorMsg && <div className="error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <h3>{editingId ? `Edit Quote ID: ${editingId}` : 'Create New Quote'}</h3>
        <div className="grid">
          <div>
            <label>Customer Name:</label>
            <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} />
          </div>
          <div>
            <label>Cover Type:</label>
            <select name="cover_type" value={form.cover_type} onChange={handleChange}>
              <option value="Single">Single</option>
              <option value="Couple">Couple</option>
              <option value="Family">Family</option>
            </select>
          </div>
          <div>
            <label>Applicant 1 Age:</label>
            <input type="number" name="app1_age" value={form.app1_age} onChange={handleChange} />
          </div>
          <div>
            <label>Applicant 1 HCH:</label>
            <select name="app1_hch" value={form.app1_hch} onChange={handleChange}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not Sure">Not Sure</option>
            </select>
          </div>

          {form.cover_type !== 'Single' && (
            <>
              <div>
                <label>Applicant 2 Age:</label>
                <input type="number" name="app2_age" value={form.app2_age} onChange={handleChange} />
              </div>
              <div>
                <label>Applicant 2 HCH:</label>
                <select name="app2_hch" value={form.app2_hch} onChange={handleChange}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not Sure">Not Sure</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label>Hospital Cover Level:</label>
            <select name="hos_cl" value={form.hos_cl} onChange={handleChange}>
              <option value="None">None</option>
              <option value="Basic">Basic</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
          </div>
          <div>
            <label>Extras Cover Level:</label>
            <select name="ext_cl" value={form.ext_cl} onChange={handleChange}>
              <option value="None">None</option>
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label>Payment Frequency:</label>
            <select name="pay_freq" value={form.pay_freq} onChange={handleChange}>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          {form.pay_freq === 'Yearly' && (
            <div>
              <label>Annual Discount (%):</label>
              <input 
                type="number" 
                name="ann_discount" 
                value={form.ann_discount} 
                onChange={handleChange} 
                min="0" 
                max="10" 
                step="0.1" 
              />
            </div>
          )}
        </div>

        <div style={{ marginTop: '10px' }}>
          <label>Notes:</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} />
        </div>

        <div style={{ marginTop: '15px' }}>
          <button type="submit" className="btn-primary">{editingId ? 'Update Quote' : 'Submit Quote'}</button>
          {editingId && (
            <button type="button" className="btn-secondary" style={{ marginLeft: '10px' }} onClick={() => { setEditingId(null); setForm({ customer_name: '', cover_type: 'Single', app1_age: 30, app1_hch: 'Yes', app2_age: '', app2_hch: 'Yes', hos_cl: 'Bronze', ext_cl: 'Standard', pay_freq: 'Monthly', ann_discount: 0, notes: '' }); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>Saved Quotes</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer Name</th>
            <th>Cover Type</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No quotes available</td></tr>
          ) : (
            quotes.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td>{q.customer_name}</td>
                <td>{q.cover_type}</td>
                <td>{q.pay_freq}</td>
                <td>
                  <button className="btn-info" style={{ marginRight: '5px' }} onClick={() => handleViewDetail(q.id)}>View</button>
                  <button className="btn-warning" style={{ marginRight: '5px' }} onClick={() => handleEditClick(q)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(q.id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedQuoteDetail && (
        <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '6px', marginTop: '20px' }}>
          <h3>Quote Details & Calculations (ID: {selectedQuoteDetail.id})</h3>
          <p><strong>Customer Name:</strong> {selectedQuoteDetail.customer_name}</p>
          <p><strong>Cover Type:</strong> {selectedQuoteDetail.cover_type}</p>
          
          {selectedQuoteDetail.price && (
            <div style={{ background: 'white', padding: '12px', borderRadius: '4px' }}>
              <h4 style={{ color: '#007BFF', marginTop: 0 }}>Calculation Result:</h4>
              <p><strong>Estimated Monthly Premium:</strong> ${selectedQuoteDetail.price["Estimated Monthly Premium"]}</p>
              <p><strong>Hospital Premium:</strong> ${selectedQuoteDetail.price["Hospital Premium"]}</p>
              <p><strong>Extras Premium:</strong> ${selectedQuoteDetail.price["Extras Premium"]}</p>
              {selectedQuoteDetail.price["Estimated Yearly Premium"] && (
                <p><strong>Estimated Yearly Premium:</strong> ${selectedQuoteDetail.price["Estimated Yearly Premium"]}</p>
              )}
            
              {selectedQuoteDetail.price["Applicant LHC Loading"] ? (
                <p><strong>Applicant LHC Loading:</strong> {selectedQuoteDetail.price["Applicant LHC Loading"]}</p>
              ) : (
                <>
                  <p><strong>Applicant 1 LHC Loading:</strong> {selectedQuoteDetail.price["Applicant 1 LHC Loading"]}</p>
                  <p><strong>Applicant 2 LHC Loading:</strong> {selectedQuoteDetail.price["Applicant 2 LHC Loading"]}</p>
                </>
              )}

              {selectedQuoteDetail.price["Family Upgrade Fee"] ? (
                <p><strong>Family Upgrade Fee:</strong> ${selectedQuoteDetail.price["Family Upgrade Fee"]}</p>
              ) : null}

              {selectedQuoteDetail.price["Estimated Yearly Premium before Discount"] && (
                <>
                  <p><strong>Yearly Premium (Before Discount):</strong> ${selectedQuoteDetail.price["Estimated Yearly Premium before Discount"]}</p>
                  <p><strong>Yearly Premium (After Discount):</strong> ${selectedQuoteDetail.price["Estimated Yearly Premium after Discount"]}</p>
                </>
              )}
              <p><em>{selectedQuoteDetail.price["Lifetime Health Cover Statement"]}</em></p>
              <p style={{ color: '#d9534f' }}><strong>Warnings:</strong> {selectedQuoteDetail.price["Warnings"]}</p>
              <p><strong>Explanation:</strong> {selectedQuoteDetail.price["Explanation"]}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}