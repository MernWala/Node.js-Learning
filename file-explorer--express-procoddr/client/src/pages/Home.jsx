import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"

const Home = () => {

    const location = useLocation();
    const fullPath = location.pathname.replace(/^\/directory\/?/, "");

    const [files, setFiles] = useState([]);
    const [file, setFile] = useState(null);
    const [uploadPercentage, setUploadPercentage] = useState(null);
    const [rename, setRename] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/api/v1/${fullPath.length > 1 ? "dir" : "files"}/${fullPath}`, {
            method: "GET",
            headers: {
                "content-type": "application/json"
            }
        }).then((res) => res.json())
            .then(data => setFiles(data))
            .catch(error => {
                console.error(error);
            });
    }, [location])

    const handleUploadFile = async (form) => {
        form.preventDefault();
        if (file === null) return;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:5000/api/v1/files/", true);
        xhr.setRequestHeader("filename", file?.[0].name);
        xhr.setRequestHeader("target", location.pathname.replace(/^\/directory\/?/, ""));

        // TO track upload finished or not
        xhr.addEventListener("load", (e) => {
            const res = JSON.parse(xhr.response);
            setFiles(prev => {
                for (const item of prev) {
                    if (item?.file === res?.file?.file) return prev;
                }

                return [...prev, res?.file]
            });
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

    const handleDelete = async ({ path, type }) => {
        const res = await fetch(`http://localhost:5000/api/v1/files/${path}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json",
                "filetype": type,
            }
        });

        const output = await res.json();
        setFiles((prev) => prev.filter(f => f?.file !== output?.deleted));
    }

    const handleClickRename = ({ path, type }) => {

        const extract = path.split("/");
        const dotTarget = extract[extract.length - 1].split(".");
        const extention = dotTarget.length > 1 ? dotTarget[dotTarget.length - 1] : null;
        const name = dotTarget[0];

        const patcher = extract.map((e, i) => {
            return i === extract?.length - 1 ? "" : e;
        }).join("/");

        setRename({
            extention,
            target: path,
            file: name,
            type,
            patcher,
        });
    }

    const handleRename = async (e) => {
        e.preventDefault();

        let newname = rename?.type === "dir" ? (rename?.newName) : (rename?.newName + "." + rename?.extention);
        const fetchApi = await fetch("http://localhost:5000/api/v1/files/", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                "oldpath": rename?.target,
                "newpath": rename?.patcher.concat(newname),
            }
        });

        const res = await fetchApi.json();

        setRename({});
        setFiles((prev) => [res?.stats, ...prev.filter(f => f?.file !== res?.stats?.oldname)]);
        e.target.reset();
    }

    const handleCreateFolder = async () => {
        const name = prompt("Enter folder name", "New Folder");
        const path = location.pathname.replace(/^\/directory\/?/, "");

        const fetchApi = await fetch(`http://localhost:5000/api/v1/dir`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ name, target: path })
        })

        const res = await fetchApi.json();
        setFiles(prev => [res?.stats, ...prev]);
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
                {files?.map(({ type, file, path }, idx) => (
                    <li key={`${file}-${idx}`} style={{ marginBottom: "10px", display: "flex", gap: "0.5rem" }}>
                        {type === "dir" ?
                            <button type="button">
                                <Link to={`/directory/${path}`}>Preview</Link>
                            </button>
                            :
                            <>
                                <button type="button">
                                    <a target="_blank" href={`http://localhost:5000/api/v1/files/${path}?action=open`}>Preview</a>
                                </button>
                                <button type="button"><a target="_blank" href={`http://localhost:5000/api/v1/files/${path}?action=download`}> Download </a></button>
                            </>
                        }
                        <button type="button" onClick={() => handleClickRename({ path, type })}> Rename </button>
                        <button type="button" onClick={() => handleDelete({ path, type })}> Delete </button>
                        <span> {file} </span>
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