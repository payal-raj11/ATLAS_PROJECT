import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { initialDistricts } from './data/mockData';
import GisMap from './components/GisMap';
import { api, logout } from './api';
import './App.css';

export default function App() {
  const [districts, setDistricts] = useState(initialDistricts);
  const [currentDistrictKey, setCurrentDistrictKey] = useState('puducherry');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Real logged-in District Authority user.
  const [me, setMe] = useState(null);

  // Real projects assigned to this district (from the tested
  // backend workflow) -- separate from the mock GIS/dashboard data
  // above, which is still illustrative sample data.
  const [realProjects, setRealProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectActionError, setProjectActionError] = useState("");

  const loadRealProjects = () => {
    api.projects.list()
      .then((data) => setRealProjects(data.projects || []))
      .catch((err) => setProjectActionError(err.message))
      .finally(() => setProjectsLoading(false));
  };

  useEffect(() => {
    api.me().then((data) => setMe(data.user)).catch(() => {});
    loadRealProjects();
  }, []);

  const handleAcceptProject = async (id) => {
    setProjectActionError("");
    try { await api.projects.accept(id); loadRealProjects(); }
    catch (err) { setProjectActionError(err.message); }
  };
  const handleRejectProject = async (id) => {
    const reason = window.prompt("Reason for returning this project to State:");
    if (reason === null) return;
    setProjectActionError("");
    try { await api.projects.reject(id, reason); loadRealProjects(); }
    catch (err) { setProjectActionError(err.message); }
  };
  const handleVerifyProject = async (id) => {
    setProjectActionError("");
    try { await api.projects.verify(id); loadRealProjects(); }
    catch (err) { setProjectActionError(err.message); }
  };
  const [isDark, setIsDark] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Panels state
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [scrutinyDoc, setScrutinyDoc] = useState(null);
  const [activeComp, setActiveComp] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieInstance = useRef(null);
  const barInstance = useRef(null);

  const currentDistrict = districts[currentDistrictKey];

  // Toast auto-hide
  const triggerToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Re-generate notifications
  useEffect(() => {
    const list = [];
    currentDistrict.docs.filter(d => d.status === "Pending").forEach(doc => {
      list.push({
        id: Math.random(),
        source: "Survey Cadre Registry",
        title: "Pending Survey Officer Document",
        text: `${doc.name} requires verification review. Scope: ${doc.scope} for ${doc.village}.`,
        read: false
      });
    });

    currentDistrict.projects.filter(p => p.status === "Delayed").forEach(proj => {
      list.push({
        id: Math.random(),
        source: "Public Works Engineering",
        title: "Project Delay Alert",
        text: `${proj.name} is behind statutory schedule by ${proj.delay}. Collectorate inquiry requested.`,
        read: false
      });
    });

    currentDistrict.compensation.filter(c => c.status === "Pending").forEach(comp => {
      list.push({
        id: Math.random(),
        source: "Land Acquisition Revenue Desk",
        title: "Pending Compensation Disbursement",
        text: `${comp.name} payout of ${comp.amount} is currently held at '${comp.stage}' stage awaiting approval.`,
        read: false
      });
    });
    setNotifications(list);
  }, [currentDistrictKey, districts]);

  // Chart Rendering
  useEffect(() => {
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? '#1a2a47' : '#e2e8f0';

    if (activeTab === 'dashboard' && pieChartRef.current) {
      if (pieInstance.current) pieInstance.current.destroy();
      const pendingDocs = currentDistrict.docs.filter(d => d.status === "Pending").length;
      const verifiedDocs = currentDistrict.docs.filter(d => d.status === "Verified").length;
      const pendingComp = currentDistrict.compensation.filter(c => c.status === "Pending").length;

      pieInstance.current = new Chart(pieChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Pending Survey Docs', 'Verified Survey Docs', 'Pending Escrow Payouts'],
          datasets: [{
            data: [pendingDocs, verifiedDocs, pendingComp],
            backgroundColor: ['#fbbf24', '#00c48c', '#f87171'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
        }
      });
    }

    if (activeTab === 'progress' && barChartRef.current) {
      if (barInstance.current) barInstance.current.destroy();
      barInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: currentDistrict.projects.map(p => p.name),
          datasets: [
            { label: 'Current Progress (%)', data: currentDistrict.projects.map(p => p.progress), backgroundColor: '#00c48c' },
            { label: 'Target Progress (%)', data: currentDistrict.projects.map(p => p.target), backgroundColor: '#38bdf8' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true, max: 100 }
          },
          plugins: { legend: { labels: { color: textColor } } }
        }
      });
    }
  }, [activeTab, currentDistrict, isDark]);

  // Actions
  const approveDocDirect = (docId) => {
    setDistricts(prev => ({
      ...prev,
      [currentDistrictKey]: {
        ...prev[currentDistrictKey],
        docs: prev[currentDistrictKey].docs.map(d => d.id === docId ? { ...d, status: 'Verified' } : d)
      }
    }));
    triggerToast("Document verified and authenticated ✓", "success");
    setScrutinyDoc(null);
  };

  const approveCompDirect = (compId) => {
    setDistricts(prev => ({
      ...prev,
      [currentDistrictKey]: {
        ...prev[currentDistrictKey],
        compensation: prev[currentDistrictKey].compensation.map(c => c.id === compId ? { ...c, status: 'Completed', stage: 'Disbursed to PFMS' } : c)
      }
    }));
    triggerToast("Compensation sanctioned and escrow transferred ✓", "success");
    setActiveComp(null);
  };

  const openNotification = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setActiveNotification(notif);
  };

  const pendingDocsCount = currentDistrict.docs.filter(d => d.status === "Pending").length;
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`app-root ${isDark ? 'dark' : ''}`}>
      {toast && <div className="toast-container"><div className="toast">{toast.msg}</div></div>}

      {/* TOPBAR (CLEAN, NO STATUTORY ROADMAP / NO SSL BADGE) */}
      <header className="atlas-topbar">
        <div className="topbar-brand-group">
          <div className="atlas-logo-box">ATLAS</div>
          <div className="atlas-brand-text">
            <strong className="atlas-system-title">National Land Acquisition & Management System</strong>
            <span className="atlas-ministry-sub">Ministry of Rural Development • Government of India</span>
          </div>
        </div>

        <div className="topbar-center">
          <select 
            className="district-select" 
            value={currentDistrictKey} 
            onChange={(e) => setCurrentDistrictKey(e.target.value)}
          >
            <option value="puducherry">Puducherry District (HQ)</option>
            <option value="karaikal">Karaikal District</option>
            <option value="mahe">Mahe District</option>
          </select>
        </div>

        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setActiveTab('notifications')}>
            🔔 {unreadNotifCount > 0 && <span className="bell-dot">{unreadNotifCount}</span>}
          </button>
          
          <button className="mode-toggle-btn" onClick={() => setIsDark(!isDark)}>
            <span className="mode-bullet"></span>
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div className="profile-container">
            <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="user-avatar">DC</div>
              <div className="user-status-dot"></div>
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown show">
                <div className="profile-header">
                  <span className="officer-name">{me?.full_name || "District Collector"}</span>
                  <span className="officer-role">{me?.district ? `${me.district} District Authority` : "Revenue Scrutiny Desk"}</span>
                  <div className="officer-id-tag">{me?.identity || "Officer ID: PY-COL-8902"}</div>
                </div>
                <div className="profile-menu">
                  <button className="profile-item text-danger" onClick={() => setShowLogoutModal(true)}>🚪 Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-role-badge">DISTRICT ADMINISTRATION</div>
          <nav className="sidebar-nav">
            <button className={`sidebar-link ${activeTab === 'dashboard' ? 'sidebar-link-active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <span>📊 Dashboard</span>
            </button>
            <button className={`sidebar-link ${activeTab === 'workflow' ? 'sidebar-link-active' : ''}`} onClick={() => setActiveTab('workflow')}>
              <span>✅ Project Workflow</span>
              {realProjects.filter(p => p.status === 'pending_district_assignment' || p.status === 'pending_district_verification').length > 0 && (
                <span className="sidebar-count">
                  {realProjects.filter(p => p.status === 'pending_district_assignment' || p.status === 'pending_district_verification').length}
                </span>
              )}
            </button>
            <button className={`sidebar-link ${activeTab === 'progress' ? 'sidebar-link-active' : ''}`} onClick={() => setActiveTab('progress')}>
              <span>🚧 Project Progress</span>
            </button>
            <button className={`sidebar-link ${activeTab === 'compensation' ? 'sidebar-link-active' : ''}`} onClick={() => setActiveTab('compensation')}>
              <span>💰 Compensation</span>
            </button>
            <button className={`sidebar-link ${activeTab === 'verification' ? 'sidebar-link-active' : ''}`} onClick={() => setActiveTab('verification')}>
              <span>📑 Verification</span>
              {pendingDocsCount > 0 && <span className="sidebar-count">{pendingDocsCount}</span>}
            </button>
            <button className={`sidebar-link ${activeTab === 'notifications' ? 'sidebar-link-active' : ''}`} onClick={() => setActiveTab('notifications')}>
              <span>🔔 Notifications</span>
              {unreadNotifCount > 0 && <span className="sidebar-count">{unreadNotifCount}</span>}
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="app-content">
          {activeTab === 'dashboard' && (
            <div className="page-section">
              <div className="welcome-banner">
                <div>
                  <h1>Welcome, {currentDistrict.title} Collectorate</h1>
                  <p>Real-time district performance metrics, cadastral map telemetry, and statutory survey validations.</p>
                </div>
                <button className="btn-glass" onClick={() => triggerToast("Survey records synchronized", "info")}>🔄 Refresh Data</button>
              </div>

              <div className="kpi-row">
                <div className="kpi-card"><span className="kpi-label">Active Projects</span><span className="kpi-value">{currentDistrict.kpis.projects}</span></div>
                <div className="kpi-card"><span className="kpi-label">Delayed Projects</span><span className="kpi-value text-danger">{currentDistrict.kpis.delays}</span></div>
                <div className="kpi-card"><span className="kpi-label">Disbursed Compensation</span><span className="kpi-value text-success">{currentDistrict.kpis.comp}</span></div>
                <div className="kpi-card"><span className="kpi-label">Pending Survey Docs</span><span className="kpi-value text-warning">{pendingDocsCount}</span></div>
              </div>

              {/* GIS FRONT-PAGE MAP COMPONENT */}
              <div className="card map-card">
                <div className="card-header-clean">
                  <div>
                    <h2>GIS Bhulekh Cadastral Spatial Map</h2>
                    <p className="card-subtext">Geospatial parcel demarcation and road corridor alignment. Click any parcel to inspect.</p>
                  </div>
                  <div className="map-legend">
                    <span className="legend-item"><span className="legend-box acquired"></span> Cleared</span>
                    <span className="legend-item"><span className="legend-box pending"></span> Under Scrutiny</span>
                    <span className="legend-item"><span className="legend-box disputed"></span> Disputed / Encroached</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '14px' }}>
                  <GisMap district={currentDistrict} onSelectParcel={setSelectedParcel} />
                  <div className="gis-info-panel">
                    <h4>Parcel Cadastral Telemetry</h4>
                    {selectedParcel ? (
                      <div>
                        <strong>Survey #{selectedParcel.id}</strong><br/>
                        <span>Owner: <b>{selectedParcel.owner}</b></span><br/>
                        <span>Extent: <b>{selectedParcel.area}</b></span><br/>
                        <span className={`badge badge-${selectedParcel.status === 'acquired' ? 'success' : selectedParcel.status === 'pending' ? 'warning' : 'danger'}`}>
                          {selectedParcel.status.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-soft)' }}>Hover or click any parcel polygon on the map.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="dashboard-charts-grid">
                <div className="card">
                  <h2>Survey Clearance Breakdown</h2>
                  <div className="chart-container"><canvas ref={pieChartRef}></canvas></div>
                </div>
                <div className="card">
                  <h2>Recent Infrastructure Alerts</h2>
                  <ul className="alerts-list">
                    {currentDistrict.alerts.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="page-section">
              <div className="card">
                <h2>District Project Analytics</h2>
                <div className="chart-container-large"><canvas ref={barChartRef}></canvas></div>
              </div>
              <div className="card">
                <h2>Project Delay Breakdown</h2>
                {currentDistrict.projects.map((p, idx) => (
                  <div key={idx} className="project-item">
                    <div className="project-header">
                      <strong>{p.name}</strong>
                      <span className={`badge ${p.status === 'Delayed' ? 'badge-danger' : 'badge-success'}`}>{p.status} ({p.delay})</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${p.progress}%` }}></div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compensation' && (
            <div className="page-section">
              <div className="card">
                <div className="card-header-clean">
                  <div><h2>Compensation & Fund Allocation</h2><p className="card-subtext">Track land acquisition payouts and authorize direct escrows.</p></div>
                  <input type="text" placeholder="Filter parcel or beneficiary..." className="table-search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <table className="data-table">
                  <thead>
                    <tr><th>Beneficiary / Parcel</th><th>Survey Extent</th><th>Sanctioned Amount</th><th>Stage</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {currentDistrict.compensation
                      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong><br/><small style={{ color: 'var(--text-soft)' }}>{c.beneficiary}</small></td>
                        <td>{c.surveyNos}</td>
                        <td><strong>{c.amount}</strong></td>
                        <td>{c.stage}</td>
                        <td><span className={`badge badge-${c.status === 'Completed' ? 'success' : 'warning'}`}>{c.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-outline" onClick={() => setActiveComp(c)}>🔍 Review</button>
                            {c.status === 'Pending' ? (
                              <button className="btn btn-primary" onClick={() => approveCompDirect(c.id)}>Approve</button>
                            ) : (
                              <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>Disbursed ✓</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="page-section">
              <div className="card">
                <h2>Real Project Workflow — Assign / Accept / Verify</h2>
                <p style={{ color: 'var(--text-soft)', fontSize: '13px', marginTop: '-8px', marginBottom: '14px' }}>
                  This is the live backend workflow (not the demo GIS data below). Projects forwarded to your district by a State Authority appear here.
                </p>
                {projectActionError && <p style={{ color: '#dc2626' }}>{projectActionError}</p>}
                {projectsLoading ? (
                  <p>Loading...</p>
                ) : realProjects.length === 0 ? (
                  <p style={{ color: 'var(--text-soft)' }}>No projects assigned to your district yet.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr><th>Code</th><th>Name</th><th>State</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {realProjects.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.code}</strong></td>
                          <td>{p.name}</td>
                          <td>{p.state}</td>
                          <td><span className="badge badge-info">{p.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {p.status === 'pending_district_assignment' && (
                                <>
                                  <button className="btn btn-primary" onClick={() => handleAcceptProject(p.id)}>Accept</button>
                                  <button className="btn btn-outline" onClick={() => handleRejectProject(p.id)}>Reject</button>
                                </>
                              )}
                              {p.status === 'pending_district_verification' && (
                                <button className="btn btn-primary" onClick={() => handleVerifyProject(p.id)}>Verify</button>
                              )}
                              {p.status !== 'pending_district_assignment' && p.status !== 'pending_district_verification' && (
                                <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>No action needed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="page-section">
              <div className="card">
                <h2>Survey Officer Land Dossier Verification</h2>
                <table className="data-table">
                  <thead>
                    <tr><th>Document</th><th>Verification Scope</th><th>Ref / Date</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {currentDistrict.docs.map((d) => (
                      <tr key={d.id}>
                        <td><strong>{d.icon} {d.name}</strong><br/><small style={{ color: 'var(--text-faint)' }}>{d.id}</small></td>
                        <td style={{ fontSize: '12px', color: 'var(--text-soft)' }}>{d.scope}</td>
                        <td>{d.date}</td>
                        <td><span className={`badge badge-${d.status === 'Verified' ? 'success' : 'warning'}`}>{d.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-outline" onClick={() => setScrutinyDoc(d)}>🔍 Scrutinize</button>
                            {d.status === 'Pending' ? (
                              <button className="btn btn-primary" onClick={() => approveDocDirect(d.id)}>Approve</button>
                            ) : (
                              <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>Verified ✓</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="page-section">
              <div className="card">
                <div className="card-header-clean">
                  <div><h2>System & Work Notifications</h2><p className="card-subtext">Click any notification to view details and mark as read.</p></div>
                  <button className="btn btn-primary" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>Mark All Read</button>
                </div>
                <div className="notification-container">
                  {notifications.map((n) => (
                    <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => openNotification(n)}>
                      <div className="notification-item-text">
                        <strong>{n.title}</strong>
                        <span>{n.text}</span>
                      </div>
                      <span className={`badge badge-${!n.read ? 'warning' : 'success'}`}>{!n.read ? 'Unread • Click' : 'Read ✓'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SCRUTINY DRAWER */}
      {scrutinyDoc && (
        <>
          <div className="drawer-overlay show" onClick={() => setScrutinyDoc(null)}></div>
          <aside className="doc-drawer show">
            <div className="drawer-header">
              <div><h3>{scrutinyDoc.icon} {scrutinyDoc.name}</h3><span className="drawer-ref">{scrutinyDoc.id}</span></div>
              <button className="drawer-close" onClick={() => setScrutinyDoc(null)}>✕</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section"><label>Verification Scope</label><p>{scrutinyDoc.scope}</p></div>
              <div className="drawer-section"><label>Attesting Officer</label><strong>{scrutinyDoc.officer}</strong></div>
              <div className="drawer-section"><label>Extent</label><strong>{scrutinyDoc.area} ({scrutinyDoc.village})</strong></div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-outline" onClick={() => { triggerToast("Flagged for re-survey", "warning"); setScrutinyDoc(null); }}>Flag for Re-Survey</button>
              {scrutinyDoc.status === 'Pending' && <button className="btn btn-primary" onClick={() => approveDocDirect(scrutinyDoc.id)}>Approve Document ✓</button>}
            </div>
          </aside>
        </>
      )}

      {/* COMPENSATION REVIEW MODAL */}
      {activeComp && (
        <div className="modal-overlay show">
          <div className="modal-card modal-large">
            <div className="modal-header-clean">
              <div><h3>{activeComp.name}</h3><span className="modal-sub">{activeComp.surveyNos}</span></div>
              <button className="drawer-close" onClick={() => setActiveComp(null)}>✕</button>
            </div>
            <div className="comp-breakdown-grid">
              <div className="comp-metric-box"><small>Beneficiary</small><strong>{activeComp.beneficiary}</strong></div>
              <div className="comp-metric-box"><small>Base Value</small><strong>{activeComp.baseValue}</strong></div>
              <div className="comp-metric-box"><small>100% Solatium</small><strong>{activeComp.solatium}</strong></div>
              <div className="comp-metric-box highlight-box"><small>Total Award</small><strong className="text-success">{activeComp.amount}</strong></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setActiveComp(null)}>Close</button>
              {activeComp.status === 'Pending' && <button className="btn btn-primary" onClick={() => approveCompDirect(activeComp.id)}>Sanction & Disburse Payout ✓</button>}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION DETAIL MODAL */}
      {activeNotification && (
        <div className="modal-overlay show">
          <div className="modal-card">
            <div className="modal-icon">🔔</div>
            <h3>{activeNotification.title}</h3>
            <p style={{ textAlign: 'left', background: 'var(--surface-soft)', padding: '12px', borderRadius: '6px' }}>{activeNotification.text}</p>
            <div className="modal-actions"><button className="btn btn-primary" onClick={() => setActiveNotification(null)}>Dismiss ✓</button></div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay show">
          <div className="modal-card">
            <div className="modal-icon">🔒</div>
            <h3>Sign Out of ATLAS?</h3>
            <p>Officer PY-COL-8902 session will be terminated.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={logout}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}