import React, { useState, useEffect } from "react";
import API from "../services/api";

// --- MODAL PER ARSYEN E NDRYSHIMIT TE STATUSIT ---
const StatusReasonModal = ({
  isOpen,
  onClose,
  onSave,
  oldStatus,
  newStatus,
}) => {
  const [reason, setReason] = useState("");
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-in">
        <div className="modal-header">
          <h3>Shkruaj Arsyen për Ndërrimin e Statusit</h3>
          <button className="close-x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>
            Pse po ndërron statusin nga{" "}
            <strong>"{oldStatus?.replace("_", " ")}"</strong> në{" "}
            <strong>"{newStatus?.replace("_", " ")}"</strong>?
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pajisja ka problem me..."
          />
        </div>
        <div className="modal-footer">
          <button className="btn-anulo" onClick={onClose}>
            Anulo
          </button>
          <button
            className="btn-ruaj"
            onClick={() => {
              onSave(reason);
              setReason("");
            }}
          >
            Ruaj
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL PER HISTORIKUN E NDRYSHIMEVE ---
const StatusHistoryModal = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content history-modal animate-in">
        <div className="modal-header">
          <h3>📜 Historia e Ndërrimeve të Statusit</h3>
          <button className="close-x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div style={{ overflowX: "auto" }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Statusi i Vjetër</th>
                  <th>Statusi i Ri</th>
                  <th>Arsyeja</th>
                  <th>Ndryshuar nga</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {history && history.length > 0 ? (
                  history.map((log, index) => (
                    <tr key={index}>
                      <td>
                        <span className={`status-pill ${log.oldStatus}`}>
                          {log.oldStatus?.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${log.newStatus}`}>
                          ➔ {log.newStatus?.replace("_", " ")}
                        </span>
                      </td>
                      <td>{log.reason}</td>
                      <td className="user-cell">
                        {log.changedBy?.name || log.changedBy}
                      </td>
                      <td className="date-cell">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Nuk ka historik për këtë aset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-anulo" onClick={onClose}>
            Mbyll
          </button>
        </div>
      </div>
    </div>
  );
};

// --- FORMULARI PËR REGJISTRIMIN E ASSET ---
const AddItemForm = ({ onRefresh }) => {
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    value: "",
    quantity: 1,
    unit: "copë",
    fundingSource: "Buxheti i Kosovës",
    status: "ne_perdorim",
    assignedTo: "",
  });

  const printDirectly = (item) => {
    const printWindow = window.open("", "_blank", "width=400,height=300");
    printWindow.document.write(`
            <html>
                <head>
                    <title>Print Barcode</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
                        body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'Courier New', monospace; }
                        .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 80px; margin: 0; line-height: 1; white-space: nowrap; }
                        .sn { font-size: 14px; margin-top: 10px; letter-spacing: 4px; font-weight: bold; }
                        .brand { font-size: 10px; margin-bottom: 5px; color: #555; }
                        @media print { @page { margin: 0; size: auto; } }
                    </style>
                </head>
                <body>
                    <div class="brand">UIBM ASSET MANAGEMENT</div>
                    <div class="barcode">*${item.serialNumber}*</div>
                    <div class="sn">${item.serialNumber}</div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
    printWindow.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        value: parseFloat(formData.value),
        quantity: parseInt(formData.quantity),
        location: formData.location.toUpperCase().trim(),
      };

      const response = await API.post("/inventory", dataToSubmit);
      printDirectly(response.data.data);

      alert("✅ Aseti u shtua me sukses!");

      setFormData({
        description: "",
        value: "",
        quantity: 1,
        location: "",
        unit: "copë",
        fundingSource: "Buxheti i Kosovës",
        status: "ne_perdorim",
        assignedTo: "",
      });
      onRefresh();
    } catch (error) {
      alert(
        "❌ Gabim: " + (error.response?.data?.message || "Provoni përsëri"),
      );
    }
  };

  return (
    <div className="glass-card animate-in">
      <div className="card-header">
        <h3>📝 Regjistrim i Ri</h3>
        <p>Pas regjistrimit, barkodi do të hapet automatikisht për printim.</p>
      </div>
      <form onSubmit={handleSubmit} className="modern-form">
        <div className="form-row">
          <div className="input-group">
            <label>Përshkrimi i mjetit</label>
            <input
              type="text"
              placeholder="Psh: Projektor Epson 4K"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>
        </div>
        <div className="form-grid-3">
          <div className="input-group">
            <label>Numri Serial (ID)</label>
            <input
              type="text"
              value="Gjenerohet automatikisht"
              readOnly
              style={{
                background: "#f8fafc",
                fontWeight: "bold",
                color: "#3b82f6",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>
          <div className="input-group">
            <label>Lokacioni</label>
            <input
              type="text"
              placeholder="Psh: K1"
              value={formData.location}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: e.target.value.toUpperCase(),
                })
              }
              required
            />
          </div>
          <div className="input-group">
            <label>Personi Përgjegjës (Email-i)</label>
            <input
              type="text"
              placeholder="emri.mbiemri@umib.net"
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
            />
          </div>
        </div>
        <div className="form-grid-4">
          <div className="input-group">
            <label>Çmimi (€)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              required
            />
          </div>
          <div className="input-group">
            <label>Sasia</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />
          </div>
          <div className="input-group">
            <label>Njësia</label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
            >
              <option value="copë">copë</option>
              <option value="pako">pako</option>
              <option value="set">set</option>
              <option value="risa">risa</option>
            </select>
          </div>
          <div className="input-group">
            <label>Statusi</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="ne_perdorim">Në Përdorim</option>
              <option value="ne_depo">Në Depo</option>
              <option value="ne_riparim">Në Riparim</option>
              <option value="i_amortizuar">I Amortizuar</option>
            </select>
          </div>
        </div>
        <button type="submit" className="submit-btn">
          💾 Regjistro dhe Printo
        </button>
      </form>
    </div>
  );
};

// --- DASHBOARD PËR FILTRIM DHE RAPORT ---
const InventoryDashboard = ({ isAdmin, isSuperViewer, isViewer, userInfo }) => {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("KREJT FK");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedValue, setSelectedValue] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [commission, setCommission] = useState({
    member1: "",
    member2: "",
    member3: "",
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [modalData, setModalData] = useState({
    isOpen: false,
    itemId: null,
    oldStatus: "",
    newStatus: "",
  });
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    history: [],
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/inventory");
      setAllItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Gabim:", error);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (item, newStatus) => {
    if (item.status === newStatus) return;
    setModalData({
      isOpen: true,
      itemId: item._id,
      oldStatus: item.status,
      newStatus: newStatus,
    });
  };

  const handleConfirmStatusUpdate = async (reason) => {
    try {
      await API.patch(`/inventory/${modalData.itemId}/status`, {
        status: modalData.newStatus,
        reason: reason,
      });
      fetchItems();
      setModalData({
        isOpen: false,
        itemId: null,
        oldStatus: "",
        newStatus: "",
      });
    } catch {
      alert("Gabim gjatë përditësimit!");
    }
  };

  const fetchHistory = async (itemId) => {
    try {
      const { data } = await API.get(`/inventory/${itemId}/history`);
      setHistoryModal({ isOpen: true, history: data });
    } catch {
      alert("Nuk u ngarkua historiku!");
    }
  };

  const handlePrintBarcode = (item) => {
    const printWindow = window.open("", "_blank", "width=250,height=150");
    const tapeWidth = "24mm";

    printWindow.document.write(`
        <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
                    
                    @page { 
                        size: ${tapeWidth} auto; 
                        margin: 0; 
                    }

                    body { 
                        margin: 0; 
                        padding: 4mm 0; /* Rritet hapësira lart/poshtë */
                        width: ${tapeWidth};
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: white;
                    }

                    .barcode-box {
                        width: 85%; /* E detyron barkodin të mos dalë në skaje */
                        text-align: center;
                    }

                    .barcode { 
                        font-family: 'Libre Barcode 39', cursive; 
                        /* E ulim madhësinë që të ketë hapësirë të bardhë majtas/djathtas */
                        font-size: 28px; 
                        line-height: 1;
                        white-space: nowrap;
                        letter-spacing: 0.5px; /* Ndihmon në dallimin e vijave */
                    }

                    .sn { 
                        font-size: 10px; 
                        font-weight: bold; 
                        font-family: Arial, sans-serif;
                        margin-top: 2mm;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="barcode-box">
                    <div class="barcode">*${item.serialNumber}*</div>
                </div>
                <div class="sn">${item.serialNumber}</div>
                
                <script>
                    window.onload = function() {
                        setTimeout(() => { 
                            window.print(); 
                            window.close(); 
                        }, 400);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
  };

  const downloadPDF = async () => {
    try {
      const response = await API.get(`/reports/download`, {
        params: {
          location: selectedLocation,
          valueRange: selectedValue,
          status: selectedStatus,
          member1: commission.member1,
          member2: commission.member2,
          member3: commission.member3,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Raporti_${selectedLocation}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Gabim gjatë shkarkimit të PDF!");
    }
  };

  // Funksioni për të bërë update datën e kontrollit vjetor
  // 1. Funksioni për Skanimin e Auditimit (Përditësuar për Live Update)
  const handleAuditScan = async (scannedSN) => {
  try {
    // Pastrojmë barkodin nga çdo karakter i padukshëm (Enter, hapësira)
    const cleanSN = scannedSN.trim();
    
    // Thirrja e rrugës - SIGUROHU që "/" është e saktë
    const { data } = await API.patch(`/inventory/scan/${cleanSN}`);

    console.log("Përgjigja nga serveri:", data);

    // Përditësojmë State-in direkt që të ndryshojë ngjyra në sekondë
    const updateItems = (items) =>
      items.map((item) =>
        item.serialNumber === data.serialNumber 
          ? { ...item, lastScanDate: data.lastScanDate } 
          : item
      );

    setAllItems((prev) => updateItems(prev));
    setFilteredItems((prev) => updateItems(prev));

  } catch (error) {
    // Rregullimi i "Gabim: undefined" - kapim mesazhin real
    const errorMsg = error.response?.data?.message || error.message;
    console.error("Gabim gjatë auditimit:", errorMsg);
    alert("Gabim: " + errorMsg);
  }
};

  // 2. Funksioni për Përcaktimin e Ngjyrës së Rreshtit
  const getRowClass = (item) => {
    // Nëse nuk ka datë skanimi fare (mjet i ri ose i paverifikuar)
    if (!item.lastScanDate) return "row-overdue";

    const sot = new Date();
    const dataFundit = new Date(item.lastScanDate);
    
    // Sigurohemi që data është valide
    if (isNaN(dataFundit.getTime())) return "row-overdue";

    // Kalkulojmë diferencën në ditë
    const diferencaDitë = (sot - dataFundit) / (1000 * 60 * 60 * 24);

    // Nëse ka kaluar më shumë se 1 vit (365 ditë) nga skanimi i fundit
    return diferencaDitë > 365 ? "row-overdue" : "row-ok";
  };
  // --- LOGJIKA E SKANERIT GLOBAL ---
  useEffect(() => {
    let barcodeData = "";
    let timeout;

    const handleKeyDown = (e) => {
      if (e.key.length > 1 && e.key !== "Enter") return;
      if (e.key !== "Enter") {
        barcodeData += e.key;
      }
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        if (barcodeData.length > 2) {
          const scannedSN = barcodeData.trim().toUpperCase().replace(/\*/g, "");

          // Gjejmë mjetin në listën ekzistuese
          const foundItem = allItems.find(
            (item) => item.serialNumber?.toUpperCase() === scannedSN,
          );

          if (foundItem) {
            // Kryejmë auditimin (Update datën)
            handleAuditScan(scannedSN);
            // Fokusojmë mjetin në tabelë
            setSearchTerm(scannedSN);

            // Pas 5 sekondave e kthejmë kërkimin në bosh që të shohim prapë listën e plotë
            setTimeout(() => setSearchTerm(""), 5000);
          }
        }
        barcodeData = "";
      }, 500);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allItems]); // Sigurohuni që allItems është këtu

  // --- FILTRIMI I TE DHENAVE ---
  useEffect(() => {
    let tempItems = [...allItems];

    if (searchTerm) {
      tempItems = tempItems.filter((item) =>
        item.serialNumber?.toUpperCase().includes(searchTerm.toUpperCase()),
      );
    }

    if (selectedLocation !== "KREJT FK") {
      tempItems = tempItems.filter(
        (item) =>
          item.location?.toUpperCase().trim() ===
          selectedLocation.toUpperCase().trim(),
      );
    }

    if (selectedStatus !== "all") {
      tempItems = tempItems.filter((item) => item.status === selectedStatus);
    }

    if (selectedValue === "low") {
      tempItems = tempItems.filter((item) => item.value < 1000);
    } else if (selectedValue === "high") {
      tempItems = tempItems.filter((item) => item.value >= 1000);
    }

    // --- SORTIMI: Të kontrolluarit e parët ---
    tempItems.sort((a, b) => {
      // Nëse a ka datë dhe b jo, a vjen i pari (-1)
      if (a.lastScanDate && !b.lastScanDate) return -1;
      // Nëse b ka datë dhe a jo, b vjen i pari (1)
      if (!a.lastScanDate && b.lastScanDate) return 1;
      // Nëse të dy kanë datë, i renditim sipas datës më të re (descending)
      if (a.lastScanDate && b.lastScanDate) {
        return new Date(b.lastScanDate) - new Date(a.lastScanDate);
      }
      return 0;
    });

    setFilteredItems(tempItems);
    setCurrentPage(1); // Reset to first page on filter change
  }, [allItems, selectedLocation, selectedStatus, selectedValue, searchTerm]);

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    fetchItems();
  }, []);

  const uniqueLocations = [
    ...new Set(allItems.map((item) => item.location?.toUpperCase().trim())),
  ].filter(Boolean);

  return (
    <div className="animate-in">
      <StatusReasonModal
        isOpen={modalData.isOpen}
        oldStatus={modalData.oldStatus}
        newStatus={modalData.newStatus}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        onSave={handleConfirmStatusUpdate}
      />

      <StatusHistoryModal
        isOpen={historyModal.isOpen}
        history={historyModal.history}
        onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
      />

      <div className="glass-card filter-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>📊 Paneli i Kontrollit</h3>
          <button
            onClick={fetchItems}
            className="btn-reset"
            style={{
              padding: "5px 15px",
              borderRadius: "8px",
              cursor: "pointer",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
            }}
          >
            Rifresko / Reset
          </button>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "5px" }}>
          💡 Mund të skanoni barkodin në çdo moment për të gjetur pajisjen.
        </p>

        <div className="modern-filters">
          {(isAdmin || isSuperViewer) && (
            <div className="filter-group">
              <label>Lokacioni</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="KREJT FK">--- KREJT FK ---</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label>Statusi</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Të Gjitha</option>
              <option value="ne_perdorim">Në Përdorim</option>
              <option value="ne_depo">Në Depo</option>
              <option value="ne_riparim">Në Riparim</option>
              <option value="i_amortizuar">I Amortizuar</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Kategoria</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              <option value="all">Të Gjitha</option>
              <option value="low">Jo-Kapitale (&lt;1000€)</option>
              <option value="high">Kapitale (&ge;1000€)</option>
            </select>
          </div>
        </div>

        {(isAdmin || isSuperViewer) && (
          <div className="commission-section">
            <h4>Mbledhja e Komisionit</h4>
            <div className="commission-inputs">
              <input
                type="text"
                placeholder="Emri i Kryetarit"
                value={commission.member1}
                onChange={(e) =>
                  setCommission({ ...commission, member1: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Anëtari 1"
                value={commission.member2}
                onChange={(e) =>
                  setCommission({ ...commission, member2: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Anëtari 2"
                value={commission.member3}
                onChange={(e) =>
                  setCommission({ ...commission, member3: e.target.value })
                }
              />
              <button className="pdf-btn" onClick={downloadPDF}>
                📥 Shkarko PDF
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="table-wrapper glass-card">
        {loading ? (
          <div className="loader">Duke u ngarkuar...</div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Barkodi</th>
                <th>Mjeti</th>
                <th>Sasia</th>
                <th>Lokacioni</th>
                {/* SHTESA: Kolona për kontrollin vjetor */}
                <th>Kontrolli Fundit</th>
                <th>Statusi</th>
                <th>Veprimet</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                /* NDRYSHIMI: Shtohet getRowClass(item) këtu për t'u bërë i kuq */
                <tr
                  key={item._id}
                  className={`${getRowClass(item)} animate-in`}
                >
                  <td>
                    <div className="barcode-container">
                      <span className="barcode-visual">
                        *{item.serialNumber || "N/A"}*
                      </span>
                      <span className="barcode-text">
                        {item.serialNumber || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="desc-cell">
                    <strong>{item.description}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {item.value} € / total:{" "}
                      {(item.quantity * item.value).toFixed(2)} €
                    </div>
                  </td>
                  <td>
                    <span className="badge-qty">
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td>{item.location}</td>

                  {/* SHTESA: Shfaqja e datës së kontrollit ose mesazhi "I pakontrolluar" */}
                  <td style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                    {item.lastScanDate ? (
                      new Date(item.lastScanDate).toLocaleDateString("sq-AL")
                    ) : (
                      <span style={{ color: "#ef4444" }}>I PAKONTROLLUAR</span>
                    )}
                  </td>

                  <td>
                    {isAdmin ? (
                      <select
                        className={`status-pill ${item.status}`}
                        value={item.status}
                        onChange={(e) => openStatusModal(item, e.target.value)}
                      >
                        <option value="ne_perdorim">Në Përdorim</option>
                        <option value="ne_depo">Në Depo</option>
                        <option value="ne_riparim">Në Riparim</option>
                        <option value="i_amortizuar">I Amortizuar</option>
                      </select>
                    ) : (
                      <span className={`status-pill ${item.status}`}>
                        {item.status.replace("_", " ").toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handlePrintBarcode(item)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                        }}
                        title="Printo"
                      >
                        🖨️
                      </button>
                      {(isAdmin || isSuperViewer || isViewer) && (
                        <button
                          onClick={() => fetchHistory(item._id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                          }}
                          title="Historiku"
                        >
                          📜
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#64748b",
                    }}
                  >
                    Nuk u gjet asnjë mjet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* --- PAGINATION UI --- */}
        {!loading && filteredItems.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Po shfaqen <strong>{indexOfFirstItem + 1}</strong> deri{" "}
              <strong>
                {Math.min(indexOfLastItem, filteredItems.length)}
              </strong>{" "}
              nga <strong>{filteredItems.length}</strong> asete
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                &laquo;
              </button>
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Show first, last, current, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="pagination-ellipsis">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- DASHBOARD PAGE ME SIDEBAR ---
const DashboardPage = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const rawRole = userInfo?.role?.trim().toLowerCase();

  const isAdmin = rawRole === "admin";
  const isSuperViewer = rawRole === "super_viewer" || rawRole === "superviewer";
  const isViewer = rawRole === "viewer";

  const [activePage, setActivePage] = useState(isAdmin ? "add" : "report");

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/";
  };

  const getRoleTitle = () => {
    if (isAdmin) return "ADMINISTRATOR";
    if (isSuperViewer) return "SUPER VIEWER";
    return "VËZHGUES";
  };

  return (
    <div className="dashboard-layout">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');`}</style>

      <aside className="modern-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">UI</div>
          <h2>
            UIBM <span>Assets</span>
          </h2>
        </div>
        <nav className="sidebar-nav">
          {isAdmin && (
            <button
              className={activePage === "add" ? "active" : ""}
              onClick={() => setActivePage("add")}
            >
              📝 Regjistro Asset
            </button>
          )}
          <button
            className={activePage === "report" ? "active" : ""}
            onClick={() => setActivePage("report")}
          >
            📊{" "}
            {isAdmin || isSuperViewer
              ? "Raportet (KREJT FK)"
              : "Pajisjet e Mia"}
          </button>
        </nav>
        <div className="user-badge-sidebar">
          <p>{userInfo?.name || "Përdorues"}</p>
          <span>{getRoleTitle()}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Dil nga Sistemi
        </button>
      </aside>
      <main className="main-viewport">
        {activePage === "add" && isAdmin && (
          <AddItemForm onRefresh={() => setActivePage("report")} />
        )}
        {activePage === "report" && (
          <InventoryDashboard
            isAdmin={isAdmin}
            isSuperViewer={isSuperViewer}
            isViewer={isViewer}
            userInfo={userInfo}
          />
        )}
      </main>

      <style>{`
                :root { --primary: #1e293b; --accent: #3b82f6; --bg: #f8fafc; --white: #ffffff; --text: #334155; }
                .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; }
                .modern-sidebar { width: 260px; background: linear-gradient(180deg, #1e293b 0%, #3b82f6 100%); color: white; padding: 2rem 1.5rem; display: flex; flex-direction: column; box-shadow: 2px 0 12px rgba(0,0,0,0.1);}
                .sidebar-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 3rem; }
                .brand-icon { background: white; color: var(--primary); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: bold; font-size: 1rem;}
                .sidebar-brand h2 { font-size: 1.25rem; }
                .sidebar-brand span { color: #facc15; }
                .user-badge-sidebar { margin-top: auto; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 15px; text-align: center; }
                .user-badge-sidebar p { font-size: 0.9rem; font-weight: 600; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .user-badge-sidebar span { font-size: 0.7rem; opacity: 0.8; letter-spacing: 1px; }
                .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 10px; }
                .sidebar-nav button { background: transparent; color: #e0e7ff; border: none; padding: 12px 15px; text-align: left; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s ease; }
                .sidebar-nav button.active, .sidebar-nav button:hover { background: rgba(255,255,255,0.15); color: white; transform: translateX(4px);}
                .logout-btn { background: #ef4444; border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s;}
                .logout-btn:hover { background: #dc2626; transform: translateY(-2px); }
                .main-viewport { flex: 1; padding: 2.5rem; overflow-y: auto; }
                .glass-card { background: var(--white); border-radius: 20px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.08); margin-bottom: 2rem; }
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; padding: 2rem; border-radius: 16px; width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
                .history-modal { width: 800px; max-width: 90%; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .modal-header h3 { font-size: 1.1rem; color: var(--primary); margin: 0; }
                .close-x { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
                .modal-body textarea { width: 100%; height: 100px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; resize: none; font-family: inherit; box-sizing: border-box; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }
                .btn-anulo { padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 600; }
                .btn-ruaj { padding: 10px 20px; border-radius: 8px; border: none; background: #10b981; color: white; cursor: pointer; font-weight: 600; }
                .history-table { width: 100%; border-collapse: collapse; }
                .history-table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 0.85rem; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                .history-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                .user-cell { font-weight: 600; color: #1e293b; }
                .date-cell { color: #94a3b8; font-size: 0.8rem; }
                .barcode-container { display: flex; flex-direction: column; align-items: center; background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; min-width: 140px; }
                .barcode-visual { font-family: 'Libre Barcode 39', cursive; font-size: 42px; line-height: 1; color: #000; white-space: nowrap; letter-spacing: 1px; }
                .barcode-text { font-size: 0.7rem; color: #475569; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 4px; }
                .modern-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-grid-3, .form-grid-4 { display: grid; gap: 1rem; align-items: end; }
                .form-grid-3 { grid-template-columns: repeat(3, 1fr); }
                .form-grid-4 { grid-template-columns: repeat(4, 1fr); }
                .input-group { display: flex; flex-direction: column; gap: 5px; }
                input, select { padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; font-size: 0.95rem; }
                .submit-btn { background: var(--accent); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; }
                .modern-filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem; }
                .pdf-btn { background: #10b981; color: white; border: none; border-radius: 12px; padding: 10px; font-weight: 600; cursor: pointer; }
                .modern-table { width: 100%; border-collapse: collapse; min-width: 900px; }
                .modern-table th { background: #f1f5f9; padding: 15px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; }
                .modern-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                .status-pill { border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
                .status-pill.ne_perdorim { background: #dcfce7; color: #166534; }
                .status-pill.ne_depo { background: #fef9c3; color: #854d0e; }
                .status-pill.ne_riparim { background: #fee2e2; color: #991b1b; }
                .status-pill.i_amortizuar { background: #f1f5f9; color: #475569; }
                .animate-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                /* RRESHTAT QË DUHET TË KONTROLLOHEN (E KUQE) */
.row-overdue { 
    background-color: #fff1f2 !important; /* Ngjyrë e kuqe shumë e lehtë */
    border-left: 5px solid #e11d48 !important; /* Vijë e kuqe e fortë në skajin e majtë */
}

/* RRESHTAT E RREGULLT (E BARDHË) */
.row-ok { 
    background-color: #ffffff; 
}

/* Kjo e bën efektin "zbehur" kur rreshti ndërron ngjyrën pas skanimit */
.modern-table tr { 
    transition: background-color 0.4s ease, border-left 0.4s ease; 
}

/* Për ta bërë tekstin "I PAKONTROLLUAR" të duket si paralajmërim */
.uncontrolled-text {
    color: #e11d48;
    font-weight: bold;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
}

/* PAGINATION STYLES */
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0 10px 0;
    margin-top: 10px;
    border-top: 1px solid #f1f5f9;
}

.pagination-info {
    font-size: 0.85rem;
    color: #64748b;
}

.pagination-controls {
    display: flex;
    gap: 5px;
    align-items: center;
}

.page-btn {
    padding: 8px 14px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #475569;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.page-btn.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-ellipsis {
    color: #94a3b8;
    padding: 0 5px;
}

@media (max-width: 768px) {
    .pagination-container {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
}
            `}</style>
    </div>
  );
};

export default DashboardPage;
