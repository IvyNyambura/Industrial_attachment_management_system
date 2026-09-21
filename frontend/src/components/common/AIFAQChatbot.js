import React, { useMemo, useState } from 'react';

const faqByRole = {
  student: [
    { q: 'How do I submit assumption of duty?', a: 'Open "Submit Assumption", fill all required fields, then submit. Ensure your registration number is correct.' },
    { q: 'How often should I update logbook?', a: 'Update your E-Logbook every week with completed tasks and skills acquired.' },
    { q: 'How do I submit my report?', a: 'Go to "Submit Report", upload the report file, and confirm successful upload message.' },
    { q: 'Who do I contact for issues?', a: 'Contact your assigned university supervisor or the industrial attachment coordinator.' },
  ],
  admin: [
    { q: 'How do I add a lecturer?', a: 'Use the "Add Lecturer" form, provide all required fields, and click add.' },
    { q: 'How do I assign supervisors?', a: 'Use region or school assign buttons in "Assign Supervisors". The system maps students to lecturers automatically.' },
    { q: 'How can I view assignments?', a: 'Scroll to "Assigned University Supervisors" to view each student-lecturer mapping.' },
    { q: 'Why are no assignments created?', a: 'Ensure lecturers exist for the selected group and students have matching records for that group.' },
    { q: 'Where do company supervisor passwords go?', a: 'They are stored hashed in the company_supervisors table. Use "Add company supervisor" on the Assign Supervisors page, or insert via the database.' },
  ],
  company_supervisor: [
    { q: 'How do I grade a student?', a: 'Enter the student registration number, select scores, and submit grading.' },
    { q: 'Can I re-submit scores?', a: 'Yes. Submitting again updates the existing grade for that student.' },
    { q: 'What if student is not found?', a: 'Confirm the registration number format and that the student is registered in the system.' },
    { q: 'What total should I submit?', a: 'Use the computed total from selected criteria before submitting.' },
  ],
  visiting_supervisor: [
    { q: 'How do I submit university grading?', a: 'Enter student registration number, select the evaluation scores, and submit.' },
    { q: 'Can I update submitted grade?', a: 'Yes. Re-submitting for the same student updates their saved grade.' },
    { q: 'What if API returns an error?', a: 'Check network availability, confirm backend is running, and retry with valid student registration number.' },
    { q: 'Which students should I assess?', a: 'Assess students assigned to you by the admin assignment process.' },
  ],
};

const normalize = (s) => (s || '').toLowerCase().replace(/[^\w\s]/g, ' ').trim();

const AIFAQChatbot = ({ role = 'student' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am your AI FAQ assistant. Ask a question or click a suggested FAQ.' },
  ]);
  const [input, setInput] = useState('');

  const faqs = useMemo(() => faqByRole[role] || faqByRole.student, [role]);

  const findAnswer = (question) => {
    const qn = normalize(question);
    if (!qn) return 'Please type a question so I can help.';

    const direct = faqs.find((f) => normalize(f.q) === qn);
    if (direct) return direct.a;

    const overlapScore = (textA, textB) => {
      const wa = new Set(normalize(textA).split(/\s+/).filter(Boolean));
      const wb = new Set(normalize(textB).split(/\s+/).filter(Boolean));
      let score = 0;
      wa.forEach((w) => {
        if (wb.has(w)) score += 1;
      });
      return score;
    };

    let best = null;
    let bestScore = 0;
    faqs.forEach((f) => {
      const score = overlapScore(question, f.q);
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    });

    if (best && bestScore > 1) return best.a;
    return 'I do not have a direct FAQ for that yet. Please check with your coordinator/admin for this specific case.';
  };

  const ask = (question) => {
    const q = question.trim();
    if (!q) return;
    const answer = findAnswer(q);
    setMessages((prev) => [...prev, { from: 'user', text: q }, { from: 'bot', text: answer }]);
    setInput('');
  };

  return (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 9999 }}>
      {open && (
        <div
          style={{
            width: '340px',
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            marginBottom: '10px',
          }}
        >
          <div style={{ background: '#4CAF50', color: '#fff', padding: '10px 12px', fontWeight: 600 }}>
            AI FAQ Assistant
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '10px' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: '8px', textAlign: m.from === 'user' ? 'right' : 'left' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: m.from === 'user' ? '#e8f5e9' : '#f5f5f5',
                    fontSize: '13px',
                  }}
                >
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {faqs.slice(0, 3).map((f) => (
                <button
                  key={f.q}
                  className="btn btn-primary"
                  style={{ padding: '6px 8px', fontSize: '11px' }}
                  onClick={() => ask(f.q)}
                >
                  {f.q}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') ask(input);
                }}
              />
              <button className="btn btn-success" style={{ padding: '8px 10px' }} onClick={() => ask(input)}>
                Ask
              </button>
            </div>
          </div>
        </div>
      )}
      <button className="btn btn-success" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close FAQ' : 'AI FAQ'}
      </button>
    </div>
  );
};

export default AIFAQChatbot;
