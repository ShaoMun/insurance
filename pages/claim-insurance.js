import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import axios from 'axios';
import FormData from 'form-data';

export default function ClaimInsurance() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateConfidenceScore = (fileName) => {
    fileName = fileName.toLowerCase();
    
    if (fileName.includes('accident')) return 75;
    if (fileName.includes('medical')) return 65;
    if (fileName.includes('receipt')) return 80;
    if (fileName.includes('report')) return 70;
    if (fileName.includes('evidence')) return 85;
    if (fileName.includes('proof')) return 82;
    if (fileName.includes('fake')) return 20;
    if (fileName.includes('test')) return 30;
    
    return 45; // Default confidence
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Calculate confidence score based on first file name
      const confidenceScore = calculateConfidenceScore(files[0].name);
      
      console.log("Uploading to IPFS...");
      
      // Create form data
      const formData = new FormData();
      formData.append('file', files[0]);

      // Upload to Pinata with API keys
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
            'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
          },
          maxContentLength: Infinity
        }
      );

      console.log("Upload response:", response.data);
      
      // Use the IPFS hash from Pinata response
      const evidenceURI = `ipfs://${response.data.IpfsHash}`;
      const claimAmount = ethers.parseEther("1");

      // Route to loading page with the IPFS URI
      router.push({
        pathname: "/loading",
        query: {
          confidenceScore: confidenceScore.toFixed(2),
          amount: claimAmount.toString(),
          evidenceURI
        },
      });

    } catch (error) {
      console.error("Failed to process claim:", error);
      setError(error.message || "Failed to process claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="upload-box">
        <h1 className="title">Document Upload</h1>
        <div
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            onChange={handleFileSelect}
            multiple
            hidden
          />
          <div className="upload-icon"></div>
          <p className="upload-text">
            Drag and drop files here <br />
            or click to browse
          </p>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <h3 className="file-list-title">Selected Files</h3>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button
          onClick={handleUpload}
          className="upload-button"
          disabled={files.length === 0 || loading}
        >
          {loading ? "Processing..." : "Submit Claim"}
        </button>
      </div>
    </div>
  );
}
