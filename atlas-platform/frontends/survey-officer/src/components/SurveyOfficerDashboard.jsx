import { useState, useEffect } from "react";

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function SurveyOfficerDashboard() {
  const [parcels, setParcels] = useState([]);
  const [selectedParcelId, setSelectedParcelId] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");

  // GPS field capture state
  const [gpsLocation, setGpsLocation] = useState(null);
  const [geoPoints, setGeoPoints] = useState([]);
  const [trackingGps, setTrackingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Field verification form state
  const [landClassification, setLandClassification] = useState("Agricultural");
  const [verifiedAreaSqm, setVerifiedAreaSqm] = useState("");
  const [boundaryDispute, setBoundaryDispute] = useState("No");
  const [fieldRemarks, setFieldRemarks] = useState("");

  // Document upload state
  const [docCategory, setDocCategory] = useState("Record of Rights (RoR / Khatauni)");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    loadParcels();
  }, []);

  async function loadParcels() {
    try {
      const res = await fetch("http://localhost:4000/api/survey/parcels");
      const data = await res.json();
      setParcels(data || []);
      if (data && data.length > 0) {
        selectParcel(data[0]);
      }
    } catch (err) {
      console.warn("Could not load parcels from backend:", err);
    }
  }

  function selectParcel(parcel) {
    setSelectedParcelId(parcel.parcel_uuid || parcel.parcelId || parcel.id);
    setLandClassification(parcel.land_classification || parcel.landClassification || "Agricultural");
    setVerifiedAreaSqm(parcel.land_area_sqm || parcel.landAreaSqm || "");
    setFieldRemarks(parcel.remarks || "");
    loadUploadedDocs(parcel.parcel_uuid || parcel.parcelId || parcel.id);

    if (parcel.latitude && parcel.longitude) {
      setGeoPoints([{ lat: parcel.latitude, lng: parcel.longitude, label: "Center" }]);
    } else {
      setGeoPoints([]);
    }
  }

  async function loadUploadedDocs(parcelId) {
    try {
      const res = await fetch(`http://localhost:4000/api/survey/documents/${parcelId}`);
      const data = await res.json();
      setUploadedDocs(data || []);
    } catch {
      setUploadedDocs([]);
    }
  }

  function toggleGpsTracker() {
    if (!trackingGps) {
      if (!("geolocation" in navigator)) {
        alert("GPS geolocation is not supported by your browser/device.");
        return;
      }
      setTrackingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGpsLocation({ lat: latitude, lng: longitude });
          setGpsAccuracy(Math.round(accuracy));
        },
        (err) => {
          alert(`GPS Error: ${err.message}`);
          setTrackingGps(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setTrackingGps(false);
    }
  }

  function pinCurrentGpsPoint() {
    if (!gpsLocation) {
      alert("Please turn on GPS first.");
      return;
    }
    const newPoint = {
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
      label: `Boundary Vertex ${geoPoints.length + 1}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setGeoPoints((prev) => [...prev, newPoint]);
  }

  async function handleSurveySubmission(e) {
    e.preventDefault();
    setSaveMessage("");

    const payload = {
      parcelUuid: selectedParcelId,
      latitude: gpsLocation?.lat || geoPoints[0]?.lat || null,
      longitude: gpsLocation?.lng || geoPoints[0]?.lng || null,
      landClassification,
      landAreaSqm: parseFloat(verifiedAreaSqm) || 0,
      recordStatus: "Survey Completed",
      boundaryDispute: boundaryDispute === "Yes" ? 1 : 0,
      fieldRemarks,
      officerId: "SO-77421",
    };

    try {
      const res = await fetch("http://localhost:4000/api/survey/submit-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveMessage("Survey verification & geo-tagging submitted successfully!");
        loadParcels();
      } else {
        setSaveMessage("Error saving survey data.");
      }
    } catch (err) {
      setSaveMessage(`Submission error: ${err.message}`);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("parcelUuid", selectedParcelId);
    formData.append("category", docCategory);

    setUploadStatus("Uploading...");

    try {
      const res = await fetch("http://localhost:4000/api/survey/upload-document", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadStatus("Document uploaded successfully!");
        setSelectedFile(null);
        loadUploadedDocs(selectedParcelId);
      } else {
        setUploadStatus("Upload failed.");
      }
    } catch (err) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  }

  const selectedParcel = parcels.find(
    (p) => (p.parcel_uuid || p.parcelId || p.id) === selectedParcelId
  );
  const districts = ["All", ...new Set(parcels.map((p) => p.district).filter(Boolean))];
  const filteredParcels = parcels.filter(
    (p) => filterDistrict === "All" || p.district === filterDistrict
  );

  return (
    <div className="page">
      <div className="page-header-row">
        <div className="page-header">
          <h1>Field Survey & Ground Truth Verification</h1>
          <p>Mark parcel boundary GPS coordinates, verify land classification, and attach landowner records.</p>
        </div>
        <div className="badge badge-info" style={{ padding: "8px 14px", fontSize: 13 }}>
          Field Officer ID: SO-77421
        </div>
      </div>

      {saveMessage && (
        <div
          className={`inline-alert ${
            saveMessage.includes("Error") ? "inline-alert-danger" : "inline-alert-success"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="two-col">
        {/* Left Column: Parcel & GPS boundary tagging */}
        <div className="stack-card">
          <div className="card">
            <div className="card-header">
              <h2>Assigned Parcel</h2>
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12 }}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    District: {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <select
                value={selectedParcelId}
                onChange={(e) => {
                  const p = parcels.find(
                    (x) => (x.parcel_uuid || x.parcelId || x.id) === e.target.value
                  );
                  if (p) selectParcel(p);
                }}
              >
                {filteredParcels.map((p) => (
                  <option key={p.parcel_uuid || p.parcelId || p.id} value={p.parcel_uuid || p.parcelId || p.id}>
                    {p.parcel_uuid || p.parcelId} | Survey #{p.survey_number || p.surveyNumber} — {p.official_owner || p.owner} ({p.village})
                  </option>
                ))}
              </select>
            </div>

            {selectedParcel && (
              <div className="detail-grid" style={{ marginTop: 16 }}>
                <div>
                  <dt>Owner Name</dt>
                  <dd><strong>{selectedParcel.official_owner || selectedParcel.owner}</strong></dd>
                </div>
                <div>
                  <dt>Official Land Area</dt>
                  <dd>{selectedParcel.official_area || selectedParcel.area} ({selectedParcel.land_area_sqm || selectedParcel.landAreaSqm} sqm)</dd>
                </div>
                <div>
                  <dt>Survey / Sub-div</dt>
                  <dd>Survey {selectedParcel.survey_number || selectedParcel.surveyNumber} / {selectedParcel.sub_division_number || selectedParcel.subDivision || "1"}</dd>
                </div>
                <div>
                  <dt>Total Compensation</dt>
                  <dd>{formatINR(selectedParcel.total_compensation || selectedParcel.totalCompensation)}</dd>
                </div>
              </div>
            )}
          </div>

          {/* GPS Boundary Recording */}
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-header">
              <h2>GPS Boundary Geo-Tagging</h2>
              <span className={`badge ${trackingGps ? "badge-success" : "badge-neutral"}`}>
                {trackingGps ? "GPS Active" : "GPS Idle"}
              </span>
            </div>
            <p className="card-subtext">Record corner vertex coordinates by standing at plot boundaries.</p>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                className={`btn-${trackingGps ? "secondary" : "primary"}`}
                onClick={toggleGpsTracker}
              >
                {trackingGps ? "Turn Off GPS" : "Turn On Device GPS"}
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={pinCurrentGpsPoint}
                disabled={!gpsLocation}
              >
                Pin Vertex Point ({geoPoints.length})
              </button>
            </div>

            {gpsLocation && (
              <div className="inline-alert inline-alert-success" style={{ marginBottom: 12 }}>
                Current Lock: <strong>{gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}</strong> (Accuracy ±{gpsAccuracy}m)
              </div>
            )}

            {geoPoints.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Point</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {geoPoints.map((pt, i) => (
                    <tr key={i}>
                      <td>{pt.label || `Point ${i + 1}`}</td>
                      <td>{Number(pt.lat).toFixed(6)}</td>
                      <td>{Number(pt.lng).toFixed(6)}</td>
                      <td>
                        <button
                          type="button"
                          className="link-btn"
                          style={{ color: "var(--danger)" }}
                          onClick={() => setGeoPoints((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No GPS vertex points pinned yet.</div>
            )}
          </div>
        </div>

        {/* Right Column: Verification Form & Document Attachments */}
        <div className="stack-card">
          <div className="card">
            <div className="card-header">
              <h2>Ground Verification Form</h2>
              <span className="badge badge-warning">Pending Officer Action</span>
            </div>

            <form onSubmit={handleSurveySubmission} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label>Actual Land Classification</label>
                <select
                  value={landClassification}
                  onChange={(e) => setLandClassification(e.target.value)}
                >
                  <option value="Agricultural">Agricultural</option>
                  <option value="Multi-crop">Multi-crop Irrigated</option>
                  <option value="Commercial">Commercial / Industrial</option>
                  <option value="Residential">Residential</option>
                  <option value="Barren">Barren / Wasteland</option>
                </select>
              </div>

              <div className="field">
                <label>Surveyed Ground Area (sq. meters)</label>
                <input
                  type="number"
                  step="0.01"
                  value={verifiedAreaSqm}
                  onChange={(e) => setVerifiedAreaSqm(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Boundary Dispute Identified on Site?</label>
                <select
                  value={boundaryDispute}
                  onChange={(e) => setBoundaryDispute(e.target.value)}
                >
                  <option value="No">No — Boundaries Clear & Agreed</option>
                  <option value="Yes">Yes — Dispute flagged between neighbors</option>
                </select>
              </div>

              <div className="field">
                <label>Officer Field Observation Remarks</label>
                <textarea
                  rows="3"
                  value={fieldRemarks}
                  onChange={(e) => setFieldRemarks(e.target.value)}
                  placeholder="Record structural details, standing crops, borewells, or tree count..."
                />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: "center" }}>
                Submit Ground Verification & Coordinates
              </button>
            </form>
          </div>

          {/* Document Upload Card */}
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-header">
              <h2>Upload Field Documents & Proofs</h2>
            </div>
            <p className="card-subtext">Attach landowner RoR (Khatauni), field sketch, or identity cards.</p>

            <form onSubmit={handleFileUpload} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="field">
                <label>Document Category</label>
                <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
                  <option value="Record of Rights (RoR / Khatauni)">Record of Rights (RoR / Khatauni)</option>
                  <option value="Field Measurement Book (FMB)">Field Measurement Book (FMB) Sketch</option>
                  <option value="Landowner Aadhaar / PAN">Landowner Aadhaar / PAN Identification</option>
                  <option value="Tree / Asset Valuation Report">Tree / Asset Valuation Report</option>
                  <option value="Dispute Affidavit">Dispute Affidavit / Legal Notice</option>
                </select>
              </div>

              <div className="field">
                <label>Select File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" className="btn-secondary" style={{ justifyContent: "center" }}>
                Upload & Link to Parcel
              </button>
              {uploadStatus && <span style={{ fontSize: 12, color: "var(--brand-dark)" }}>{uploadStatus}</span>}
            </form>

            <div style={{ marginTop: 16 }}>
              <strong>Attached Documents ({uploadedDocs.length})</strong>
              <ul className="mini-list" style={{ marginTop: 8 }}>
                {uploadedDocs.map((doc, idx) => (
                  <li key={idx}>
                    <div className="dot dot-info" />
                    <div>
                      <strong>{doc.title || doc.category}</strong>
                      <span>Uploaded on {doc.date || "Today"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}