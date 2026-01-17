import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddFileModal from "../components/AddFileModal";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  /* FETCH FILES */
  const fetchFiles = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE_URL}/api/files`, { headers });
      setFiles(res.data);
    } catch (err) {
      console.error("Failed to fetch files");
    }
  }, [API_BASE_URL, token]);

  /* LOAD USER + FILES */
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_BASE_URL}/api/auth/me`, { headers }),
      axios.get(`${API_BASE_URL}/api/files`, { headers }),
    ])
      .then(([userRes, filesRes]) => {
        setUser(userRes.data);
        setFiles(filesRes.data);
      })
      .catch(() => {
        localStorage.clear();
        navigate("/");
      });

    const handleFocus = () => {
      fetchFiles(); // popup close hone ke baad refresh
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate, API_BASE_URL, token, fetchFiles]);

  /* CONNECT QBO */
  const connectQBO = async (fileId) => {
    const res = await axios.get(
      `${API_BASE_URL}/api/qbo/connect/${fileId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const width = 1200;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      res.data.url,
      "_blank",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  /* LOGOUT */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* SAVE FILE */
  const saveFile = async (data) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/files`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFiles((prev) => [res.data, ...prev]);
      setShowModal(false);
    } catch {
      alert("Failed to save file");
    }
  };

  if (!user) return <p className="p-10">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-72 bg-white shadow-lg flex flex-col justify-between">
        <div className="p-6">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <hr className="my-4" />
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            + Add File
          </button>
        </div>

        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full table-fixed border-2 border-gray-300">
            <thead className="bg-gray-400 text-lg">
              <tr>
                <th className="p-3 text-left w-2/5">Name</th>
                <th className="p-3 text-left w-1/5">Destination Region</th>
                <th className="p-3 text-left w-1/5">Created Time</th>
                <th className="p-3 text-center w-1/5">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No files created yet
                  </td>
                </tr>
              )}

              {files.map((file, index) => (
                <tr
                  key={file._id}
                  className={`border-t ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-200"
                  }`}
                >
                  <td
                    className={`p-3 truncate font-bold italic cursor-pointer ${
                      file?.qbo?.isConnected
                        ? "text-blue-600 hover:underline"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      file?.qbo?.isConnected &&
                      navigate(`/file/${file._id}`)
                    }
                  >
                    {file.fileName}
                  </td>

                  <td className="p-3 font-bold italic">
                    {file.destinationRegion}
                  </td>

                  <td className="p-3 font-bold italic">
                    {new Date(file.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>

                  <td className="p-3 text-center">
                    {file?.qbo?.isConnected ? (
                      <button
                        onClick={() => navigate(`/file/${file._id}`)}
                        className="bg-emerald-600 text-white px-5 py-2 rounded font-bold italic hover:bg-emerald-700"
                      >
                        Connected
                      </button>
                    ) : (
                      <button
                        onClick={() => connectQBO(file._id)}
                        className="bg-green-600 text-white px-5 py-2 rounded font-bold italic hover:bg-green-900"
                      >
                        Connect QBO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddFileModal
          onClose={() => setShowModal(false)}
          onSave={saveFile}
        />
      )}
    </div>
  );
}
