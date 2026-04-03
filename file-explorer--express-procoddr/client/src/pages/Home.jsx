import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

const Home = () => {
    const [files, setFiles] = useState([]);
    const [directories, setDirectories] = useState([]);
    const location = useLocation();
    const { id = '' } = useParams()
    const [file, setFile] = useState(null);
    const [uploadPercentage, setUploadPercentage] = useState(null);
    const [rename, setRename] = useState(null);
    const [currentPath, setCurrentPath] = useState([]);

    useEffect(() => {
        if (location.pathname.includes("dir") || location.pathname === "/") {
            fetch(`http://localhost:5000/api/v2/dir/${id}`, {
                method: "GET",
                headers: {
                    "content-type": "application/json"
                }
            })
                .then((res) => res.json())
                .then(data => {
                    setFiles(data.payload.files);
                    setDirectories(data.payload.directories);
                    setCurrentPath(data.payload.currentPath ?? []);
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }, [id])

    const handleUploadFile = async (form) => {
        form.preventDefault();
        if (file === null) return;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:5000/api/v2/file/", true);
        xhr.setRequestHeader("name", file?.[0].name);
        xhr.setRequestHeader("folder", id !== "" ? id : null);

        // TO track upload finished or not
        xhr.addEventListener("load", (e) => {
            const res = JSON.parse(xhr.response);
            setFiles(prev => ([...prev, res?.file]))
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

    const handleDelete = async ({ id, type }) => {
        const res = await fetch(`http://localhost:5000/api/v2/${type}/${id}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json",
            }
        });

        const output = await res.json();
        if (output?.success === true) {
            if (type === "dir") {
                setDirectories(d => d.filter(fd => fd.id !== id));
            } else {
                setFiles(f => f.filter(ff => ff.id !== id));
            }
        } else {
            alert("Something went wrong! File not deleted.");
        }
    }

    const handleClickRename = ({ id, type }) => {
        let data = null;
        if (type === "dir") {
            data = directories.find(d => d.id === id);
        } else if (type === "file") {
            data = files.find(f => f.id === id);
        }

        const name = (data?.name || data?.filename).split(".")[0];
        setRename({ id, name, type });
    }

    const handleRename = async (e) => {
        e.preventDefault();
        const fetchApi = await fetch(`http://localhost:5000/api/v2/${rename.type}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: rename.id,
                name: rename?.newName
            })
        });

        const res = await fetchApi.json();
        const extract = rename?.type === "dir" ? res.directory : res.file;
        if (rename.type === "dir") {
            setDirectories(prev => prev.map(d => d.id === rename.id ? extract : d));
        } else {
            setFiles(prev => prev.map(f => f.id === rename.id ? { ...extract, filename: extract.filename } : f));
        }

        setRename(null);
        e.target.reset();
    }

    const handleCreateFolder = async () => {
        const name = prompt("Enter folder name", "New Folder");
        if (!name || name.trim() === "") return; // Cancel or empty input

        try {
            const fetchApi = await fetch(`http://localhost:5000/api/v2/dir`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ name: name.trim(), parentDir: id !== "" ? id : "root" })
            });

            const res = await fetchApi.json();
            if (res?.success === true && res?.directory) {
                setDirectories(prev => [...prev, res.directory]);
            } else {
                alert("Failed to create folder. Please try again.");
            }
        } catch (error) {
            console.error("Error creating folder:", error);
            alert("Something went wrong! Folder not created.");
        }
    }

    return (
        <div>
            My Files
            {rename && (
                <div style={{ margin: "2rem 0" }}>
                    <form onSubmit={handleRename}>
                        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                            <input
                                type="text"
                                name="filename"
                                id="filename"
                                onChange={(e) => setRename(prev => ({ ...prev, newName: e.target.value }))}
                                defaultValue={rename?.name}
                                autoFocus
                            />
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button type="submit"> Rename </button>
                                <button type="button" onClick={() => setRename(null)}> Cancel </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ margin: '20px 0' }}>
                File Path:
                <span style={{ display: "inline-flex", gap: "5px", margin: "0 5px", alignItems: "center" }}>
                    {currentPath?.map(({ id, name }, index) => (
                        <div key={id} style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <Link to={`/dir/${id}`}>{name}</Link>
                            {index < currentPath.length - 1 && <span style={{ fontFamily: "monospace" }}>&gt;</span>}
                        </div>
                    ))}
                </span>
            </div>

            <ul>
                {directories?.sort((a, b) => a.name.localeCompare(b.name)).map(({ id, name }) => (
                    <li key={id} style={{ marginBottom: "10px", display: "flex", gap: "0.5rem" }}>
                        <button type="button">
                            <Link to={`/dir/${id}`}> Preview </Link>
                        </button>
                        <button type="button" onClick={() => handleClickRename({ id, type: "dir" })}> Rename </button>
                        <button type="button" onClick={() => handleDelete({ id, type: "dir" })}> Delete </button>
                        <span> {name} </span>
                    </li>
                ))}

                {files?.sort((a, b) => a.filename.localeCompare(b.filename)).map(({ id, filename }) => (
                    <li key={id} style={{ marginBottom: "10px", display: "flex", gap: "0.5rem" }}>
                        <button type="button">
                            <a target="_blank" href={`http://localhost:5000/api/v2/file/${id}?action=open`}> Preview </a>
                        </button>
                        <button type="button"><a target="_blank" href={`http://localhost:5000/api/v2/file/${id}?action=download`}> Download </a></button>
                        <button type="button" onClick={() => handleClickRename({ id, type: "file" })}> Rename </button>
                        <button type="button" onClick={() => handleDelete({ id, type: "file" })}> Delete </button>
                        <span> {filename} </span>
                    </li>
                ))}
            </ul>

            <div style={{ margin: "2rem 0" }}>
                <form onSubmit={handleUploadFile}>
                    {uploadPercentage && (
                        <p style={{ marginBottom: "0.5rem" }}> {uploadPercentage} % uploaded </p>
                    )}
                    <input type="file" name="upload_file" onChange={(e) => setFile(e.target.files)} />
                    <button type="submit"> Upload </button>
                </form>
            </div>

            <div>
                <button type="button" onClick={handleCreateFolder}> Create Folder </button>
            </div>
        </div>
    )
}

export default Home