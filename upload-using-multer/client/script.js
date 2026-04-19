const formTag = document.querySelector("form");

const details = document.querySelector("#details");
const data = details.querySelector("#percentatge");
const setData = (per) => data.innerText = `${per}%`

formTag.addEventListener("submit", (e) => {
    e.preventDefault(); 

    const formData = new FormData(formTag);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/upload", true);
    xhr.responseType = "json";

    xhr.addEventListener("load", (e) => {
        console.log('Status:', xhr.status);
        console.log('Response:', xhr.response);
        
        if (xhr.status === 200) {
            console.log('Success:', xhr.response);
            alert("File uploaded successfully!");
        } else {
            console.error('Failed:', xhr.response);
            alert("Upload failed: " + (xhr.response?.message || "Unknown error"));
        }
        setData(0);
        formTag.reset();
    });

    xhr.addEventListener("error", (e) => {
        console.error("Upload error - Server not reachable");
        alert("Upload failed - Server not running?");
        setData(0);
        formTag.reset();
    });

    xhr.addEventListener("abort", (e) => {
        console.error("Upload aborted");
        alert("Upload was aborted");
        setData(0);
        formTag.reset();
    });

    xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100
            setData(progress.toFixed(2));
        }
    });

    xhr.send(formData);
});