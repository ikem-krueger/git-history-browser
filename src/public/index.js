const port = "3000";
const host = `http://localhost:${port}`;

let timerId;

const ms = 200;

function debounce(func) {
    return (...args) => {
        clearTimeout(timerId);

        timerId = setTimeout(func, ms, ...args);
    }
}

function basename(path) {
    return path.substr(path.lastIndexOf('/') + 1);
}

function saveData(filename, data) {
    // IE11 support
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        const blob = new Blob([data], {type: "octet/stream"});

        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else { // other browsers
        const file = new File([data], filename, {type: "octet/stream"});
        const exportUrl = URL.createObjectURL(file);

        window.location.assign(exportUrl);

        URL.revokeObjectURL(exportUrl);
    }
}

async function httpRequest(url, data, type) {
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

        if(type == "json") {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch(e) {
        console.error(e);
    }
}

function filterOptions(event) {
    const options = event.target.parentElement.querySelector("select").options

    const length = options.length;

    for(let i = 0; i < length; i++) {
        const option = options[i];

        let text = option.textContent.toLowerCase();
        let searchTerm = event.target.value.toLowerCase();

        if(!searchTerm.startsWith("/")){
            text.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");

            continue; // skip the rest of the logic below
        }

        const match = searchTerm.match(/\/(hash|author|date) (.*)/);

        if(match) {
            const command = match[1];

            switch(command) {
                case "hash":
                    text = option.value;

                    break;
                case "author":
                    text = option.dataset.author.toLowerCase();

                    break;
                case "date":
                    text = option.dataset.date.toLowerCase();

                    break;
            }

            searchTerm = match[2];

            text.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");
        }
    }
}

async function populateCommitHistory(path) {
    const selectCommits = document.querySelector("#commits");

    const commits = await httpRequest(host + '/commits', { path: path }, type="json");

    const length = commits.length;

    selectCommits.length = length; // creates empty option elements

    for(let i = 0; i < length; i++) { // fills them with data
        const option = selectCommits[i];
        const commit = commits[i];

        option.textContent = commit.message;
        option.value = commit.hash;
        option.dataset.author = commit.author;
        option.dataset.date = commit.date;
    }

    selectCommits.selectedIndex = 0;

    selectCommits.focus();

    const inputSlider = document.querySelector("#slider");

    inputSlider.min = 1;
    inputSlider.value = selectCommits.selectedIndex + 1;
    inputSlider.max = selectCommits.length;

    const commit = selectCommits[0].value;

    populateFilesystemTree(path, commit);
}

async function populateFilesystemTree(path, commit) {
    const selectFiles = document.querySelector("#files");

    const files = await httpRequest(host + '/files', { path: path, commit: commit }, type="json");

    const length = files.length;

    selectFiles.length = length; // creates empty option elements

    for(let i = 0; i < length; i++) { // fills them with data
        const option = selectFiles[i];
        const file = files[i];

        option.textContent = file.file;
        option.value = file.hash;
        option.dataset.mode = file.mode;
        option.dataset.type = file.type;
        option.dataset.size = file.size;
    }

    selectFiles.selectedIndex = 0; // FIXME: hardcoded value

    commit = selectFiles[0].value;

    populateFileContent(path, commit);

    updateCommitDetails();
}

function updateCommitDetails() {
    const selectCommits = document.querySelector("#commits");
    const inputSlider = document.querySelector("#slider");

    inputSlider.value = (selectCommits.selectedIndex + 1);

    const option = selectCommits[selectCommits.selectedIndex];

    const spanCommitNumber = document.querySelector("#commit-number");
    const spanCommitHash = document.querySelector("#commit-hash");
    const spanCommitAuthor = document.querySelector("#commit-author");
    const spanCommitDate = document.querySelector("#commit-date");

    spanCommitNumber.textContent = `Commit: #${(selectCommits.length - selectCommits.selectedIndex)}/${selectCommits.length}`;
    spanCommitHash.textContent = `Hash: ${option.value}`;
    spanCommitAuthor.textContent = `Author: ${option.dataset.author}`;
    spanCommitDate.textContent = `Date: ${option.dataset.date}`;
}

async function populateFileContent(path, commit) {
    const divContent = document.querySelector("#content");

    const content = await httpRequest(host + '/content', { path: path, commit: commit }, type="text");

    divContent.textContent = content;

    updateFileDetails();
}

function updateFileDetails() {
    const selectFiles = document.querySelector("#files");

    const option = selectFiles[selectFiles.selectedIndex];

    const spanFileNumber = document.querySelector("#file-number");
    const spanFileHash = document.querySelector("#file-hash");
    const spanFileMode = document.querySelector("#file-mode");
    const spanFileSize = document.querySelector("#file-size");

    spanFileNumber.textContent = `File: #${(selectFiles.selectedIndex + 1)}/${selectFiles.length}`;
    spanFileHash.textContent = `Hash: ${option.value}`;
    spanFileMode.textContent = `Mode: ${option.dataset.mode}`;
    spanFileSize.textContent = `Size: ${option.dataset.size} Bytes`;
}

function main() {
    populateCommitHistory = debounce(populateCommitHistory);
    populateFilesystemTree = debounce(populateFilesystemTree);
    populateFileContent = debounce(populateFileContent);
    filterOptions = debounce(filterOptions);

    const form = document.querySelector("form");

    form.addEventListener("submit", (event) => { 
        event.preventDefault();
    });

    const inputPath = document.querySelector("#path");

    inputPath.addEventListener("keydown", (event) => {
        if(event.key == "Enter") {
            const path = document.querySelector("#path").value;

            populateCommitHistory(path);
        }
    });

    inputPath.focus();

    const selectCommits = document.querySelector("#commits");

    selectCommits.addEventListener("change", (event) => {
        const path = document.querySelector("#path").value;
        const commit = selectCommits.value;

        populateFilesystemTree(path, commit);
    });

    const inputFilterCommits = document.querySelector("#filter-commits");

    inputFilterCommits.addEventListener("keyup", (event) => {
        filterOptions(event);
    });

    const inputSlider = document.querySelector("#slider");

    inputSlider.addEventListener("change", (event) => {
        selectCommits.selectedIndex = (inputSlider.value - 1);

        const path = document.querySelector("#path").value;
        const commit = selectCommits.value;

        populateFilesystemTree(path, commit);
    });

    const selectFiles = document.querySelector("#files");

    selectFiles.addEventListener("change", (event) => {
        const path = document.querySelector("#path").value;
        const commit = selectFiles.value;

        populateFileContent(path, commit);
    });

    const inputFilterFiles = document.querySelector("#filter-files");

    inputFilterFiles.addEventListener("keyup", (event) => {
        filterOptions(event);
    });

    const buttonCheckout = document.querySelector("#checkout");

    buttonCheckout.addEventListener("click", (event) => {
        const files = document.querySelector("#files");
        const content = document.querySelector("#content");

        const filename = basename(files[files.selectedIndex].textContent);
        const data = content.textContent;

        saveData(filename, data);
    });
}

main();
