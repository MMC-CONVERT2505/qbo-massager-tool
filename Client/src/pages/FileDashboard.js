import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function FileDashboard() {
  const { fileId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_BASE_URL}/api/auth/me`, { headers }),
      axios.get(`${API_BASE_URL}/api/files/${fileId}`, { headers }),
      axios.get(`${API_BASE_URL}/api/qborawdata/sync-dates/${fileId}`, { headers }),
    ])
      .then(async ([userRes, fileRes, syncDateRes]) => {
        setUser(userRes.data);
        setFile(fileRes.data);

        setModuleDates(syncDateRes.data);

        if (
          fileRes.data?.qbo?.isConnected &&
          !fileRes.data.qbo.companyName
        ) {
          const companyRes = await axios.get(
            `${API_BASE_URL}/api/qbocompany/company/${fileId}`,
            { headers }
          );
          setCompanyName(companyRes.data.companyName);
        } else {
          setCompanyName(fileRes.data?.qbo?.companyName || "");
        }
      })
      .catch(() => navigate("/dashboard"));
  }, [fileId, token, navigate, API_BASE_URL]);

  const disconnectQBO = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/qbo/disconnect/${fileId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Directly dashboard par bhej do
      navigate("/dashboard");

    } catch (err) {
      alert("Failed to disconnect QBO");
    }
  };

  const QBO_MODULES = [
    { key: "account", label: "Account" },
    { key: "customer", label: "Customer" },
    { key: "vendor", label: "Vendor" },
    { key: "item", label: "Item" },
    { key: "class", label: "Class" },
    { key: "taxrate", label: "TaxRate" },
    { key: "companycurrency", label: "Currency" },
    { key: "term", label: "Term" },
    { key: "invoice", label: "Invoice" },
    { key: "bill", label: "Bill" },
    { key: "payment", label: "ReceivePayment" },
    { key: "billpayment", label: "BillPayment" },
    { key: "vendorcredit", label: "VendorCredit" },
    { key: "creditmemo", label: "CreditMemo" },
    { key: "journalentry", label: "JournalEntry" },
    { key: "transfer", label: "Transfer" },
    { key: "deposit", label: "Deposit" },
    { key: "estimate", label: "Estimate" },
    { key: "purchaseorder", label: "PurchaseOrder" },
    { key: "salesreceipt", label: "SalesReceipt" },

  ];

  const allModuleKeys = QBO_MODULES.map((m) => m.key);

  const isAllSelected =
    selectedModules.length === allModuleKeys.length;

  const STATUS = {
    NOT_SYNCED: "Not Synced",
    FETCHING: "Fetching",
    COMPLETED: "Completed",
    ERROR: "Error",
  };
  const STATUS_KEY = `qbo_sync_status_${fileId}`;

  const [moduleStatus, setModuleStatus] = useState(() => {
    return JSON.parse(localStorage.getItem(STATUS_KEY)) || {};
  });
  const [moduleDates, setModuleDates] = useState({});


  if (!file || !user) return <p className="p-10">Loading...</p>;

  const updateStatus = (module, status) => {
    setModuleStatus((prev) => {
      const updated = { ...prev, [module]: status };
      localStorage.setItem(STATUS_KEY, JSON.stringify(updated));
      return updated;
    });
  };


  const toggleModule = (key) => {
    setSelectedModules((prev) =>
      prev.includes(key)
        ? prev.filter((m) => m !== key)
        : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedModules([]);
    } else {
      setSelectedModules(allModuleKeys);
    }
  };

  const syncQboData = async () => {
    if (!selectedModules.length) {
      alert("Select at least one module");
      return;
    }

    setSyncLoading(true);

    for (const module of selectedModules) {
      try {
        // 1️⃣ Fetching start
        updateStatus(module, STATUS.FETCHING);

        // 2️⃣ Call API for single module
        await axios.post(
          `${API_BASE_URL}/api/qbo/sync`,
          {
            fileId,
            modules: [module], // 👈 single module
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // 3️⃣ Completed
        updateStatus(module, STATUS.COMPLETED);

        // 4️⃣ Refresh sync date for that module
        const dateRes = await axios.get(
          `${API_BASE_URL}/api/qborawdata/sync-dates/${fileId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setModuleDates(dateRes.data);

      } catch (err) {
        updateStatus(module, STATUS.ERROR);
        console.error(`Sync failed for ${module}`, err);
      }
    }

    setSyncLoading(false);
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-72 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>

          <h2 className="text-xl font-bold">{user.name}</h2>

          <hr className="my-4" />

          <h2 className="text-xl font-bold mb-4">File Info</h2>

          <p className="mb-3">
            <span className="font-bold">QBO Status</span>
            <br />
            {file.qbo?.isConnected ? (
              <span className="text-green-600 font-semibold">Connected</span>
            ) : (
              <span className="text-red-500 font-semibold">Not Connected</span>
            )}
          </p>

          <p>
            <span className="font-bold">File Name</span>
            <br />
          </p>
          <h3 className="font-bold italic text-gray-800 mb-3">{file.fileName}</h3>

          <p>
            <span className="font-bold">Destination Region</span>
            <br />
          </p>
          <h3 className="font-bold italic text-gray-800 mb-3">{file.destinationRegion}</h3>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {/* SUMMARY PAGE BUTTON */}
          <button
            onClick={() => navigate(`/summary/${fileId}`)}
            className="bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
          >
            📊 Summary Dashboard
          </button>

          {/* BACK TO DASHBOARD */}
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            ← Back to Dashboard
          </button>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10">
        {/* TOP NAVBAR */}
        <div className="bg-white shadow rounded-lg px-6 py-4 mb-6 flex items-center">
          {/* LEFT → QBO Realm ID */}
          {file.qbo?.isConnected && (
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-500 font-bold">QBO Realm ID</p>
              <p className="font-bold text-gray-800">
                {file.qbo.realmId}
              </p>
            </div>
          )}

          {/* CENTER → QBO Company Name */}
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 font-bold">QBO Company</p>
            <p className="font-bold text-gray-800">
              {companyName || "Loading..."}
            </p>
          </div>

          {/* RIGHT → DISCONNECT QBO */}
          <div className="flex-1 text-right">
            {file.qbo?.isConnected && (
              <button
                onClick={disconnectQBO}
                className="bg-red-500 text-white px-4 py-2 rounded font-bold italic hover:bg-red-600"
              >
                Disconnect QBO
              </button>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg text-center font-bold mb-4">QBO Data Sync</h2>
          {!file.qbo?.isConnected ? (
            <p className="text-red-500 italic">
              Please connect QBO to sync data
            </p>
          ) : (
            <>
              {/* FIXED HEIGHT TABLE */}
              <div className="max-h-[435px] overflow-y-auto border rounded">
                <table className="min-w-full">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {/* <th className="p-3 w-16 text-left">Select</th> */}
                      <th className="p-3 w-16 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>

                      <th className="p-3 text-left">QBO Module</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Fetched Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {QBO_MODULES.map((mod, idx) => {
                      const status =
                        moduleStatus[mod.key] || STATUS.NOT_SYNCED;

                      const date = moduleDates[mod.key];

                      return (
                        <tr
                          key={mod.key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          {/* SELECT */}
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedModules.includes(mod.key)}
                              onChange={() => toggleModule(mod.key)}
                              className="w-4 h-4"
                            />
                          </td>

                          {/* MODULE */}
                          <td className="p-3 font-semibold">
                            {mod.label}
                          </td>

                          {/* STATUS */}
                          <td className="p-3">
                            {status === STATUS.COMPLETED && (
                              <span className="text-green-600 font-semibold">
                                Completed
                              </span>
                            )}
                            {status === STATUS.FETCHING && (
                              <span className="text-blue-600 font-semibold animate-pulse">
                                Fetching...
                              </span>
                            )}
                            {status === STATUS.ERROR && (
                              <span className="text-red-600 font-semibold">
                                Error
                              </span>
                            )}
                            {status === STATUS.NOT_SYNCED && (
                              <span className="text-gray-400 italic">
                                Not Synced
                              </span>
                            )}
                          </td>

                          {/* DATE */}
                          <td className="p-3 text-sm text-gray-600">
                            {date ? (
                              new Date(date).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            ) : (
                              "--Not Fetched--"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ACTION */}
              <div className="mt-6">
                <button
                  onClick={syncQboData}
                  disabled={syncLoading}
                  className={`px-6 py-2 rounded font-bold text-white ${syncLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {syncLoading ? "Syncing..." : "Sync Selected Modules"}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
