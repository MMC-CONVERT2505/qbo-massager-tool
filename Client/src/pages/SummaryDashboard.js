import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function SummaryDashboard() {
    const { fileId } = useParams();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [user, setUser] = useState(null);
    const [companyName, setCompanyName] = useState("");
    const [moduleSummary, setModuleSummary] = useState({});

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

                // 🔹 company name (same as before)
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

                // ✅ NEW: module-wise count + last sync (realmId based)
                if (fileRes.data?.qbo?.realmId) {
                    const summaryRes = await axios.get(
                        `${API_BASE_URL}/api/qborawdata/summary/${fileRes.data.qbo.realmId}`,
                        { headers }
                    );
                    setModuleSummary(summaryRes.data);
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

    const [moduleDates, setModuleDates] = useState({});


    if (!file || !user) return <p className="p-10">Loading...</p>;


    const fetchModuleSummary = async (realmId) => {
        const res = await axios.get(
            `${API_BASE_URL}/api/qborawdata/summary/${realmId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        setModuleSummary(res.data);
    };

    const deleteModuleData = async (moduleKey) => {
        if (!window.confirm(`Delete all ${moduleKey} data for this QBO company?`)) {
            return;
        }

        try {
            await axios.delete(
                `${API_BASE_URL}/api/qborawdata/delete/${file.qbo.realmId}/${moduleKey}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // 🔄 refresh sync dates
            const dateRes = await axios.get(
                `${API_BASE_URL}/api/qborawdata/sync-dates/${fileId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setModuleDates(dateRes.data);

            // 🔥 refresh counts (THIS WAS MISSING)
            await fetchModuleSummary(file.qbo.realmId);

            alert(`${moduleKey} data deleted successfully`);
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete module data");
        }
    };

    const excelExport = async (moduleKey) => {
        const region = file.destinationRegion;

        if (
            !window.confirm(
                `Export Excel:- ${region}_${moduleKey} Excel Sheet?`
            )
        ) {
            return;
        }

        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/qborawdata/export-excel/${fileId}/${region}/${moduleKey}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `${companyName}_${region}_${moduleKey}.xlsx`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);

            // 🔄 refresh sync dates
            const dateRes = await axios.get(
                `${API_BASE_URL}/api/qborawdata/sync-dates/${fileId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setModuleDates(dateRes.data);

            // 🔢 refresh counts
            await fetchModuleSummary(file.qbo.realmId);

            alert(`${region}_${moduleKey} Excel exported successfully`);
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export Excel");
        }
    };


    const csvExport = async (moduleKey) => {
        const region = file.destinationRegion;

        if (
            !window.confirm(
                `Export CSV:- ${region}_${moduleKey} CSV Sheet?`
            )
        ) {
            return;
        }

        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/qborawdata/export-csv/${fileId}/${region}/${moduleKey}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `${companyName}_${region}_${moduleKey}.csv`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);

            // 🔄 refresh sync dates
            const dateRes = await axios.get(
                `${API_BASE_URL}/api/qborawdata/sync-dates/${fileId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setModuleDates(dateRes.data);

            // 🔢 refresh counts
            await fetchModuleSummary(file.qbo.realmId);

            alert(`${region}_${moduleKey} CSV exported successfully`);
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export CSV");
        }
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
                        onClick={() => navigate(`/file/${fileId}`)}
                        className="bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
                    >
                        📊 File Dashboard
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
                    <h2 className="text-lg text-center font-bold mb-4">QBO Data Summary</h2>
                    {!file.qbo?.isConnected ? (
                        <p className="text-red-500 italic">
                            Please connect QBO to sync data
                        </p>
                    ) : (
                        <>
                            {/* FIXED HEIGHT TABLE */}
                            <div className="max-h-[500px] overflow-y-auto border rounded">
                                <table className="min-w-full">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 text-left">QBO Module</th>
                                            <th className="p-3 text-left">Records</th>
                                            <th className="p-3 text-left">Fetched Date</th>
                                            <th className="p-3 text-left">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {QBO_MODULES.map((mod, idx) => {
                                            const date = moduleDates[mod.key];
                                            const summary = moduleSummary[mod.key];
                                            const count = summary?.count ?? 0;
                                            const isDisabled = count === 0;

                                            return (
                                                <tr
                                                    key={mod.key}
                                                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                                >
                                                    {/* MODULE */}
                                                    <td className="p-3 font-semibold">
                                                        {mod.label}
                                                    </td>


                                                    <td className="p-3 font-semibold text-gray-800">
                                                        {summary?.count ?? 0}
                                                    </td>


                                                    {/* FETCHED DATE (Previously Status column) */}
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

                                                    {/* ACTIONS (Previously Fetched Date column) */}
                                                    <td className="p-3 flex gap-3">
                                                        {/* Excel Button */}
                                                        <button
                                                            disabled={isDisabled}
                                                            className={`px-3 py-1 rounded text-sm text-white
            ${isDisabled
                                                                    ? "bg-gray-400 cursor-not-allowed"
                                                                    : "bg-green-900 hover:bg-green-700"
                                                                }`}
                                                            onClick={() => excelExport(mod.key)}
                                                        >
                                                            📥 Excel
                                                        </button>

                                                        {/* CSV Button */}
                                                        <button
                                                            disabled={isDisabled}
                                                            className={`px-3 py-1 rounded text-sm text-white
            ${isDisabled
                                                                    ? "bg-gray-400 cursor-not-allowed"
                                                                    : "bg-green-700 hover:bg-green-500"
                                                                }`}
                                                            onClick={() => csvExport(mod.key)}
                                                        >
                                                            📥 CSV
                                                        </button>

                                                        {/* Delete Button (optional: always enabled) */}
                                                        <button
                                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                            onClick={() => deleteModuleData(mod.key)}
                                                        >
                                                            🗑 Delete
                                                        </button>
                                                    </td>

                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
