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

function filterOptions(event) {
    const options = event.target.parentElement.querySelector("select").options

    const length = options.length;

    for(let i = 0; i < length; i++) {
        const option = options[i];

        let text = option.textContent.toLowerCase();
        let searchTerm = event.target.value.toLowerCase();

        if(!searchTerm.startsWith("/")){ // if the searchTerm is not a command...
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
    const branch = document.querySelector("#branch");

    const params = new URLSearchParams();

    params.set("path", path);

    const branches = await fetch('/branch?' + params).then(res => res.json());

    branch.length = branches.length;

    for(let i = 0; i < branches.length; i++) {
        branch[i].textContent = branches[i].trim();

        const match = branches[i].match(/\* (.*)/);

        if(match) {
            branch[i].textContent = match[1];

            branch.selectedIndex = i;
        }
    }

    const selectCommits = document.querySelector("#commits");

    const commits = await fetch('/commits?' + params).then(res => res.json());

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

    countAuthorCommits(20);

    populateFilesystemTree(path, commit);
}

function countAuthorCommits(max) {
    const commits = document.querySelector("#commits");

    const options = commits.options;

    const length = options.length;

    const authorCommits = {};

    for(let i = 0; i < length; i++) {
        const option = options[i];

        const author = option.dataset.author;

        const count = 1;

        authorCommits[author] ? authorCommits[author] += count : authorCommits[author] = count;
    }

    // TODO: refactor the code below
    const v = Object.values(authorCommits).sort((a, b) => b - a).slice(0, max);
    const k = Object.keys(authorCommits);

    const commitsAuthor = {};

    for(let i = 0; i < k.length; i++) {
        const count = authorCommits[k[i]];
        const author = k[i];

        if(v.includes(count)) {

            commitsAuthor[count] = author;
        }
    }

    for(let i = 0; i < v.length; i++) {
        const nr = i + 1;
        const commits = v[i];
        const author = commitsAuthor[commits];

        console.log(`#${nr}: ${author} (${commits})`);
    }
}

async function populateFilesystemTree(path, commit) {
    const selectFiles = document.querySelector("#files");

    const params = new URLSearchParams();
    
    params.set("path", path);
    params.set("commit", commit);

    const files = await fetch('/files?' + params).then(res => res.json());

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

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("commit", commit);

    const content = await fetch('/content?' + params).then(res => res.text());

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
