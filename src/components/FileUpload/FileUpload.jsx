import React, { useRef, useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { storage } from "../../firebase";
import './FileUpload.css';

const FileUpload = ({ onLogout }) => {
  const inputRef = useRef();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState("select");
  const [finalDownloadURLs, setFinalDownloadURLs] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (uploadStatus === "uploading" || uploadStatus === "waiting") {
      const totalFiles = selectedFiles.length;
      setTimeRemaining(totalFiles * 20);
    }
  }, [uploadStatus, selectedFiles]);

  useEffect(() => {
    if (timeRemaining > 0 && (uploadStatus === "uploading" || uploadStatus === "waiting")) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(prev - 1, 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining, uploadStatus]);

  useEffect(() => {
    if (Object.keys(finalDownloadURLs).length === selectedFiles.length && timeRemaining > 0) {
      setTimeRemaining(0);
    }
  }, [finalDownloadURLs, selectedFiles, timeRemaining]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const onChooseFile = () => {
    inputRef.current.click();
  };

  const clearFileInput = () => {
    inputRef.current.value = "";
    setSelectedFiles([]);
    setProgress({});
    setUploadStatus("select");
    setFinalDownloadURLs({});
    setOverallProgress(0);
    setTimeRemaining(0);
  };

  const handleUpload = async () => {
    if (uploadStatus === "done") {
      clearFileInput();
      return;
    }

    try {
      setUploadStatus("uploading");

      selectedFiles.forEach((file) => {
        const storageRef = ref(storage, `uploads/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(prev => ({ ...prev, [file.name]: fileProgress }));
          },
          (error) => {
            console.error("Upload failed:", error);
            setUploadStatus("select");
          },
          () => {
            console.log("Upload complete, file uploaded to Firebase Storage");
            setProgress(prev => ({ ...prev, [file.name]: 100 }));
            waitForFinalFile(file);
          }
        );
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      setUploadStatus("select");
    }
  };

  const waitForFinalFile = (file) => {
    const intervalId = setInterval(async () => {
      try {
        const finalFileName = file.name.replace(/\.[^/.]+$/, file.name.endsWith(".docx") ? ".docx" : ".pptx");
        const finalFileRef = ref(storage, `final/${finalFileName}`);
        const finalURL = await getDownloadURL(finalFileRef);
        setFinalDownloadURLs(prev => ({ ...prev, [file.name]: finalURL }));
        if (Object.keys(finalDownloadURLs).length + 1 === selectedFiles.length) {
          setUploadStatus("done");
          setTimeRemaining(0);
        }
        clearInterval(intervalId);
      } catch (error) {
        console.log("Final file not yet available, retrying...");
      }
    }, 5000); // Check every 5 seconds
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();
      const folder = zip.folder("modified_files");
      const downloadPromises = Object.keys(finalDownloadURLs).map(async (fileName) => {
        const response = await fetch(finalDownloadURLs[fileName]);
        if (!response.ok) {
          throw new Error(`Failed to fetch file ${fileName}: ${response.statusText}`);
        }
        const blob = await response.blob();
        folder.file(fileName, blob);
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "modified_files.zip");
    } catch (error) {
      console.error("Error downloading all files:", error);
    }
  };

  return (
    <div className="file-upload-container">
      <button className="logout-btn" onClick={onLogout}>Logout</button>
      <div className="header">
        <h1 className="title-heading">Generations Document Tool</h1>
      </div>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".docx,.pptx"
        multiple
      />

      {!selectedFiles.length && (
        <button className="file-btn" onClick={onChooseFile}>
          <span className="material-symbols-outlined">upload</span> Upload Files
        </button>
      )}

      {selectedFiles.length > 0 && (
        <>
          <div className="file-list">
            {selectedFiles.map(file => (
              <div key={file.name} className="file-card">
                <span className="material-symbols-outlined icon">description</span>

                <div className="file-info">
                  <div style={{ flex: 1 }}>
                    <h6>{file.name}</h6>

                    <div className="progress-bg">
                      <div className="progress" style={{ width: `${progress[file.name] || 0}%` }} />
                    </div>
                  </div>

                  {uploadStatus === "select" ? (
                    <button onClick={clearFileInput}>
                      <span className="material-symbols-outlined close-icon">close</span>
                    </button>
                  ) : (
                    <div className="check-circle">
                      {uploadStatus === "uploading" ? (
                        `${progress[file.name] || 0}%`
                      ) : finalDownloadURLs[file.name] ? (
                        <a href={finalDownloadURLs[file.name]} target="_blank" rel="noopener noreferrer" className="download-btn">
                          <span className="material-symbols-outlined">download</span>
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="upload-btn" onClick={handleUpload}>
            {uploadStatus === "select" || uploadStatus === 'uploading' ? "Upload" : "Done"}
          </button>

          {uploadStatus !== "select" && (
            <div className="file-card">
              <div className="file-info">
                <div style={{ flex: 1 }}>
                  <h6>Modifying files, please wait...</h6>

                  <div className="progress-bg">
                    <div className="progress" style={{ width: `${(1 - timeRemaining / (selectedFiles.length * 20)) * 100}%` }} />
                  </div>
                  <p>Estimated time remaining: {timeRemaining}s</p>
                </div>
              </div>
            </div>
          )}

          {Object.keys(finalDownloadURLs).length > 0 && (
            <div className="download-all-btn-container">
              <button onClick={handleDownloadAll} className="download-all-btn">
                <span className="material-symbols-outlined">download</span> Download All Modified Files
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FileUpload;
