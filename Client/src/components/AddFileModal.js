import { useState } from "react";

export default function AddFileModal({ onClose, onSave }) {
  const [fileName, setFileName] = useState("");
  const [destinationRegion, setDestinationRegion] = useState("");

  const regions = [
    { value: "USA", label: "USA" },
    { value: "SA", label: "South Africa" },
    { value: "AUS", label: "Australia" },
    { value: "UK", label: "United Kingdom" },
    { value: "OTHER", label: "Other" },
  ];

  const handleSave = () => {
    if (!fileName || !destinationRegion) {
      alert("All fields are required");
      return;
    }
    onSave({ fileName, destinationRegion });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Add File</h2>

        {/* FILE NAME */}
        <input
          className="w-full border p-2 rounded mb-3"
          placeholder="File Name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />

        {/* DESTINATION REGION DROPDOWN */}
        <select
          className="w-full border p-2 rounded mb-4 bg-white"
          value={destinationRegion}
          onChange={(e) => setDestinationRegion(e.target.value)}
        >
          <option value="">Select Destination Region</option>
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
