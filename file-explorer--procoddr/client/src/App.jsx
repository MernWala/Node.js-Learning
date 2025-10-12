import { useEffect, useState } from "react"

const App = () => {

  const [files, setFiles] = useState([])
  const [file, setFile] = useState(null);
  const [uploadPercentage, setUploadPercentage] = useState(null);
  const [rename, setRename] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000`, {
      method: "GET",
      headers: {
        "content-type": "application/json"
      }
    }).then((res) => res.json())
      .then(data => setFiles(data))
      .catch(error => {
        console.error(error);
      });
  }, [])

  const handleUploadFile = async (form) => {
    form.preventDefault();
    if (file === null) return;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/", true);
    xhr.setRequestHeader("filename", file?.[0].name);

    // TO track upload finished or not
    xhr.addEventListener("load", (e) => {
      const res = JSON.parse(xhr.response);
      setFiles(prev => [...prev, res?.file]);
      setFile(null);
      setUploadPercentage(null);
      form.target.reset();
    });

    xhr.upload.addEventListener("progress", (e) => {
      const progress = (e.loaded / e.total) * 100
      setUploadPercentage(progress.toFixed(2));
    });

    xhr.send(file?.[0]);
  }

  const handleDelete = async (file) => {
    const res = await fetch(`http://localhost:5000/`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        filename: file
      }
    });

    const output = await res.json();
    setFiles((prev) => prev.filter(p => p !== output?.deleted));
  }

  const handleClickRename = (file) => {
    const ext = file.split(".");
    const name = file.substring(0, (file.length - ext[ext.length - 1].length - 1));

    setRename({
      extention: ext[ext.length - 1],
      target: file,
      file: name
    });
  }

  const handleRename = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "oldfile": rename?.target,
        "newfile": rename?.newName + "." + rename?.extention,
      }
    });

    const out = await res.json();
    setFiles(prev => prev.map(f => f === out.oldfile ? out.newfile : f));
  }

  return (
    <div>
      My Files

      <div style={{ margin: "2rem 0" }}>
        <form onSubmit={handleRename}>
          <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            <input
              type="text"
              name="filename"
              id="filename"
              onChange={(e) => setRename(prev => ({ ...prev, newName: e.target.value }))}
              defaultValue={rename?.file}
            />

            <button type="submit"> Rename </button>
          </div>
        </form>
      </div>

      <ul>
        {files.map((file, idx) => (
          <li key={`${file}-${idx}`} style={{ marginBottom: "10px", display: "flex", gap: "0.5rem" }}>
            <button type="button"><a target="_blank" href={`http://localhost:5000/storage/images/${file}?action=open`}>Preview</a></button>
            <button type="button"><a target="_blank" href={`http://localhost:5000/storage/images/${file}?action=download`}>Download</a></button>
            <button type="button" onClick={() => handleClickRename(file)}> Rename </button>
            <button type="button" onClick={() => handleDelete(file)}> Delete </button>
            <span> {file} </span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "2rem" }}>
        <form onSubmit={handleUploadFile}>
          {uploadPercentage && (
            <p style={{ marginBottom: "0.5rem" }}> {uploadPercentage} % uploaded </p>
          )}
          <input type="file" name="upload_file" onChange={(e) => setFile(e.target.files)} />
          <button type="submit"> Upload </button>
        </form>
      </div>
    </div>
  )
}

export default App