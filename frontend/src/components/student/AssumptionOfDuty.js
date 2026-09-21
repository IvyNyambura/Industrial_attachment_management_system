import React, { useEffect, useState } from 'react';
import StatusNotice from '../common/StatusNotice';

import { API_BASE } from '../../api';

// ── Validation rules ──────────────────────────────────────────────────────────
const VALIDATORS = {
  firstName: (v) => {
    if (!v.trim()) return 'First name is required.';
    if (v.trim().length < 2) return 'First name must be at least 2 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'First name must contain letters only.';
    return '';
  },
  lastName: (v) => {
    if (!v.trim()) return 'Last name is required.';
    if (v.trim().length < 2) return 'Last name must be at least 2 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Last name must contain letters only.';
    return '';
  },
  otherNames: (v) => {
    if (v && !/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Other names must contain letters only.';
    return '';
  },
  programme: (v) => {
    if (!v.trim()) return 'Programme is required.';
    if (v.trim().length < 3) return 'Please enter a valid programme name.';
    return '';
  },
  indexNumber: (v) => {
    if (!v.trim()) return 'Registration number is required.';
    // Accepts formats like: 2021/CS/001, CS/2021/001, 12345678, etc.
    if (v.trim().length < 4) return 'Registration number is too short.';
    if (!/^[a-zA-Z0-9/\-]+$/.test(v.trim())) return 'Registration number must contain only letters, numbers, / or -.';
    return '';
  },
  companyName: (v) => {
    if (!v.trim()) return 'Company name is required.';
    if (v.trim().length < 2) return 'Please enter a valid company name.';
    return '';
  },
  supervisorName: (v) => {
    if (!v.trim()) return "Supervisor's name is required.";
    if (v.trim().length < 2) return 'Please enter a valid supervisor name.';
    if (!/^[a-zA-Z\s'.,-]+$/.test(v.trim())) return 'Supervisor name must contain letters only.';
    return '';
  },
  supervisorContact: (v) => {
    if (!v.trim()) return "Supervisor's contact is required.";
    const digits = v.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) return 'Please enter a valid phone number (9–15 digits).';
    if (!/^[+\d\s\-()]+$/.test(v.trim())) return 'Phone number can only contain digits, +, -, (, ) or spaces.';
    return '';
  },
  supervisorEmail: (v) => {
    if (!v.trim()) return "Supervisor's email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Please enter a valid email address.';
    return '';
  },
  companyRegion: (v) => {
    if (!v) return 'Please select a company region.';
    return '';
  },
  address: (v) => {
    if (!v.trim()) return 'Company address is required.';
    if (v.trim().length < 10) return 'Please enter a more complete address (at least 10 characters).';
    return '';
  },
};

const REQUIRED_FIELDS = [
  'firstName', 'lastName', 'programme', 'indexNumber',
  'companyName', 'supervisorName', 'supervisorContact', 'supervisorEmail',
  'companyRegion', 'address',
];

// ── Sub-component: field error message ────────────────────────────────────────
const FieldError = ({ message }) =>
  message ? (
    <p style={{
      margin: '5px 0 0',
      fontSize: '13px',
      color: 'var(--color-text-danger)',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    }}>
      <span style={{ fontSize: '14px' }}>&#9888;</span> {message}
    </p>
  ) : null;

// ── Main component ────────────────────────────────────────────────────────────
const AssumptionOfDuty = ({ indexNumber }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    programme: '',
    indexNumber: indexNumber || '',
    companyName: '',
    supervisorName: '',
    supervisorContact: '',
    supervisorEmail: '',
    companyRegion: 'Nairobi',
    address: '',
    locationVerified: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [notice, setNotice] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    if (indexNumber) {
      setFormData(prev => ({ ...prev, indexNumber }));
    }
  }, [indexNumber]);

  // Validate a single field
  const validateField = (name, value) => {
    const validator = VALIDATORS[name];
    return validator ? validator(value) : '';
  };

  // Validate all fields, returns errors object
  const validateAll = (data) => {
    const errs = {};
    Object.keys(VALIDATORS).forEach((field) => {
      const msg = validateField(field, data[field] ?? '');
      if (msg) errs[field] = msg;
    });
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Live-validate if field was already touched or submit attempted
    if (touched[name] || submitAttempted) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setFormData(prev => ({ ...prev, locationVerified: true }));
        },
        () => {
          setNotice({
            type: 'error',
            message: 'Could not get your location. Please enable location services or enter the address manually.',
          });
        }
      );
    } else {
      setNotice({ type: 'error', message: 'Geolocation is not supported by your browser.' });
    }
  };

  const openGoogleMapsPicker = () => {
    const query = formData.address || formData.companyRegion || 'Nairobi, Kenya';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank', 'width=900,height=700');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const allErrors = validateAll(formData);
    setErrors(allErrors);

    // Mark all required fields as touched so errors show
    const allTouched = {};
    REQUIRED_FIELDS.forEach(f => { allTouched[f] = true; });
    setTouched(allTouched);

    if (Object.values(allErrors).some(Boolean)) {
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-has-error="true"]');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      indexNumber: formData.indexNumber || indexNumber,
      companyName: formData.companyName,
      supervisorName: formData.supervisorName,
      supervisorContact: formData.supervisorContact,
      supervisorEmail: formData.supervisorEmail,
      companyRegion: formData.companyRegion,
      address: formData.address,
    };

    try {
      const response = await fetch(`${API_BASE}/api/student/assumption-duty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit assumption of duty');
      }

      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message || 'An error occurred while submitting the form.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count errors for banner
  const errorCount = Object.values(errors).filter(Boolean).length;

  // ── Styles ──
  const inputBase = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const inputError = {
    ...inputBase,
    border: '2px solid var(--color-border-danger, #e24b4a)',
    backgroundColor: 'var(--color-background-danger, #fff8f8)',
  };

  const inputValid = {
    ...inputBase,
    border: '2px solid var(--color-border-success, #3b6d11)',
  };

  const getInputStyle = (name) => {
    if (!touched[name] && !submitAttempted) return inputBase;
    if (errors[name]) return inputError;
    const validator = VALIDATORS[name];
    const required = REQUIRED_FIELDS.includes(name);
    if (required || validator) return inputValid;
    return inputBase;
  };

  const fieldProps = (name) => ({
    name,
    value: formData[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    style: getInputStyle(name),
    'data-has-error': !!(errors[name]) ? 'true' : 'false',
  });

  // ── Render ──
  return (
    <div>
      <div className="page-header">ASSUMPTION OF DUTY FORM</div>

      <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

      {/* ── Validation error banner ── */}
      {submitAttempted && errorCount > 0 && (
        <div style={{
          margin: '0 0 20px',
          padding: '14px 18px',
          background: 'var(--color-background-danger, #fff0f0)',
          border: '1.5px solid var(--color-border-danger, #e24b4a)',
          borderRadius: '8px',
          color: 'var(--color-text-danger, #a32d2d)',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          &#9888;&nbsp; Please fix <strong>{errorCount}</strong> error{errorCount > 1 ? 's' : ''} before submitting.
        </div>
      )}

      {/* ── Success banner ── */}
      {submitStatus === 'success' && (
        <div style={{
          margin: '0 0 20px',
          padding: '14px 18px',
          background: 'var(--color-background-success, #e8f5e9)',
          border: '1.5px solid var(--color-border-success, #3b6d11)',
          borderRadius: '8px',
          color: 'var(--color-text-success, #27500a)',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          &#10003;&nbsp; Assumption of Duty submitted successfully!
        </div>
      )}

      {/* ── API error banner ── */}
      {submitStatus?.type === 'error' && (
        <div style={{
          margin: '0 0 20px',
          padding: '14px 18px',
          background: 'var(--color-background-danger, #fff0f0)',
          border: '1.5px solid var(--color-border-danger, #e24b4a)',
          borderRadius: '8px',
          color: 'var(--color-text-danger, #a32d2d)',
          fontSize: '14px',
        }}>
          &#9888;&nbsp; {submitStatus.message}
        </div>
      )}

      <form className="form-container" onSubmit={handleSubmit} noValidate>

        {/* ── STUDENT INFORMATION ── */}
        <div className="form-section">
          <h3>Student Information</h3>

          <div className="form-group">
            <label>First Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" placeholder="Enter your first name" required {...fieldProps('firstName')} />
            <FieldError message={errors.firstName} />
          </div>

          <div className="form-group">
            <label>Last Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" placeholder="Enter your last name" required {...fieldProps('lastName')} />
            <FieldError message={errors.lastName} />
          </div>

          <div className="form-group">
            <label>Other Name(s)</label>
            <input type="text" placeholder="Enter other name(s)" {...fieldProps('otherNames')} />
            <FieldError message={errors.otherNames} />
          </div>

          <div className="form-group">
            <label>Programme <span style={{ color: 'red' }}>*</span></label>
            <input type="text" placeholder="Enter your programme" required {...fieldProps('programme')} />
            <FieldError message={errors.programme} />
          </div>

          <div className="form-group">
            <label>Registration Number <span style={{ color: 'red' }}>*</span></label>
            <input type="text" placeholder="e.g. 2021/CS/001" required {...fieldProps('indexNumber')} />
            <FieldError message={errors.indexNumber} />
          </div>
        </div>

        {/* ── COMPANY DETAILS ── */}
        <div className="form-section">
          <h3>Company Details</h3>

          <div className="form-group">
            <label>Company Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" placeholder="Enter company name" required {...fieldProps('companyName')} />
            <FieldError message={errors.companyName} />
          </div>

          <div className="form-group">
            <label>Supervisor's Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" placeholder="Enter supervisor's name" required {...fieldProps('supervisorName')} />
            <FieldError message={errors.supervisorName} />
          </div>

          <div className="form-group">
            <label>Supervisor's Contact <span style={{ color: 'red' }}>*</span></label>
            <input type="tel" placeholder="e.g. +254 712 345 678" required {...fieldProps('supervisorContact')} />
            <FieldError message={errors.supervisorContact} />
          </div>

          <div className="form-group">
            <label>Supervisor's Email <span style={{ color: 'red' }}>*</span></label>
            <input type="email" placeholder="e.g. supervisor@company.com" required {...fieldProps('supervisorEmail')} />
            <FieldError message={errors.supervisorEmail} />
          </div>

          <div className="form-group">
            <label>Select Company Region <span style={{ color: 'red' }}>*</span></label>
            <select required {...fieldProps('companyRegion')}>
              <option value="Nairobi">Nairobi</option>
              <option value="Nyeri">Nyeri</option>
              <option value="Muranga">Murang'a</option>
              <option value="Kiambu">Kiambu</option>
              <option value="Kirinyaga">Kirinyaga</option>
              <option value="Embu">Embu</option>
              <option value="Machakos">Machakos</option>
              <option value="Nyandarua">Nyandarua</option>
              <option value="Laikipia">Laikipia</option>
              <option value="Nakuru">Nakuru</option>
            </select>
            <FieldError message={errors.companyRegion} />
          </div>

          {/* ── COMPANY ADDRESS + MAPS ── */}
          <div className="form-group">
            <label>Company Address <span style={{ color: 'red' }}>*</span></label>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={openGoogleMapsPicker}
                style={{
                  padding: '11px 20px',
                  background: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                &#128205; Open Google Maps
              </button>

              <button
                type="button"
                onClick={getCurrentLocation}
                style={{
                  padding: '11px 20px',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                &#127919; Use Current Location
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMapPicker(prev => !prev)}
              style={{
                width: '100%',
                padding: '11px',
                background: showMapPicker ? '#fce8e6' : '#f1f3f4',
                border: `2px ${showMapPicker ? 'solid #d93025' : 'dashed #4285f4'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: showMapPicker ? '#d93025' : '#1967d2',
                marginBottom: '12px',
              }}
            >
              {showMapPicker ? '▲ Hide Map Preview' : '▼ Show Google Maps Preview'}
            </button>

            {showMapPicker && (
              <div style={{
                border: '2px solid #4285f4',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '14px',
              }}>
                <iframe
                  width="100%"
                  height="420"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                    formData.address || formData.companyRegion || 'Nairobi, Kenya'
                  )}&zoom=15`}
                  title="Company Location Map"
                />
                <div style={{
                  padding: '10px 14px',
                  background: '#e8f0fe',
                  fontSize: '13px',
                  color: '#1967d2',
                  borderTop: '1px solid #c5d4f5',
                }}>
                  The map updates as you type your address below.
                </div>
              </div>
            )}

            <textarea
              name="address"
              placeholder="Enter full company address (e.g., Safaricom Limited, Waiyaki Way, Westlands, Nairobi)"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="3"
              data-has-error={!!errors.address ? 'true' : 'false'}
              required
              style={{
                ...getInputStyle('address'),
                resize: 'vertical',
                lineHeight: '1.6',
              }}
            />
            <FieldError message={errors.address} />

            {formData.address && !formData.locationVerified && !errors.address && (
              <p style={{
                marginTop: '8px', fontSize: '13px', color: '#555',
                padding: '10px', background: '#fef7e0',
                borderRadius: '6px', border: '1px solid #f9ab00',
              }}>
                Address entered manually. For better accuracy, click <strong>Use Current Location</strong> or <strong>Open Google Maps</strong>.
              </p>
            )}

            {formData.locationVerified && (
              <p style={{
                marginTop: '8px', fontSize: '13px', color: '#1b5e20',
                padding: '10px', background: '#e8f5e9',
                borderRadius: '6px', border: '1px solid #34a853',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '18px' }}>&#10003;</span>
                <strong>Location verified via GPS!</strong> Your visiting supervisor can find this location easily.
              </p>
            )}
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-submit"
            style={{
              padding: '15px 50px',
              fontSize: '16px',
              fontWeight: '700',
              background: isSubmitting
                ? '#aaa'
                : 'linear-gradient(135deg, #4CAF50, #45a049)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'SUBMIT ASSUMPTION FORM'}
          </button>
        </div>
      </form>

      <div style={{
        position: 'fixed', bottom: '20px', left: '50%',
        transform: 'translateX(-50%)',
        background: '#4CAF50', color: 'white',
        padding: '12px 30px', borderRadius: '25px',
        fontSize: '14px', fontWeight: 'bold',
        zIndex: 1000,
      }}>
        Students Assumption of Duty Form
      </div>
    </div>
  );
};

export default AssumptionOfDuty;
