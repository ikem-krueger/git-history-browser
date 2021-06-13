const port = "3000";
const host = `http://localhost:${port}`;

let timerId;

const ms = 200;

HTMLCollection.prototype.forEach = Array.prototype.forEach;

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

    options.forEach((option) => {
        let textContent = option.textContent.toLowerCase();
        let searchTerm = event.target.value.toLowerCase();

        if(!searchTerm.startsWith("/")){ // if the searchTerm is not a command...
            textContent.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");

            return; // skip the rest of the logic below
        }

        const match = searchTerm.match(/^\/(hash|author|date|change) (.*)/);

        if(!match) {
            return;
        }

        const command = match[1];

        switch(command) {
            case "hash":
                textContent = option.value;

                break;
            case "author":
                textContent = option.dataset.author.toLowerCase();

                break;
            case "date":
                textContent = option.dataset.date.toLowerCase();

                break;
            case "change":
                textContent = option.dataset.change.toLowerCase();

                break;
        }

        searchTerm = match[2];

        textContent.indexOf(searchTerm) == -1 ? option.classList.add("hide") : option.classList.remove("hide");
    });
}

function calculatePercent(w, g) {
    const percent = Math.round(((w + 1)/g) * 100);

    return percent;
}

function updateProgressBar(percent) {
    const progressBar = document.querySelector("#progressBar");

    progressBar.style.width = `${percent}%`;
}

async function populateBranches(path) {
    const selectBranch = document.querySelector("#branch");

    const params = new URLSearchParams();

    params.set("path", path);

    const branches = await fetch('/branches?' + params).then(res => res.json());

    selectBranch.length = branches.length; // creates empty option elements

    branches.forEach((branch, i) => { // fills them with data
        updateProgressBar(calculatePercent(i, branches.length));

        const option = selectBranch[i];

        branch = branch.trim();

        // active branch
        const matchAsterisk = branch.match(/^\* (.*)/);

        if(matchAsterisk) {
            option.textContent = matchAsterisk[1];
            option.value = matchAsterisk[1];

            selectBranch.selectedIndex = i;

            const branch = option.value;

            console.log(`Active branch found: '${branch}'`);

            populateCommitHistory(path, branch);

            return; // skip the rest of the logic below
        }

        // HEAD
        const matchHead = branch.match(/^(.*HEAD) -> .*/);

        if(matchHead) {
            option.textContent = branch;
            option.value = matchHead[1];

            return; // skip the rest of the logic below
        }

        // other branches
        option.textContent = branch;
        option.value = branch;
    });
}

async function populateCommitHistory(path, branch) {
    const params = new URLSearchParams();

    params.set("path", path);
    params.set("branch", branch);

    const selectCommits = document.querySelector("#commits");

    const commits = await fetch('/commits?' + params).then(res => res.json());

    selectCommits.length = commits.length; // creates empty option elements

    commits.forEach((commit, i) => { // fills them with data
        updateProgressBar(calculatePercent(i, commits.length));

        const option = selectCommits[i];

        option.textContent = commit.message;
        option.value = commit.hash;
        option.dataset.author = commit.author;
        option.dataset.date = commit.date;
        option.dataset.timestamp = commit.timestamp;

        if(i == 0) {
            const hash = option.value;

            console.log(`First commit found: '${option.textContent}'`);

            populateFilesystemTree(path, hash);
        }
    });

    selectCommits.selectedIndex = 0;

    selectCommits.focus();

    const inputSlider = document.querySelector("#slider");

    inputSlider.min = 1;
    inputSlider.value = selectCommits.selectedIndex + 1;
    inputSlider.max = selectCommits.length;

    const hash = selectCommits[0].value;

    const infoBox = document.querySelector("#infobox");

    const firstCommit = selectCommits[commits.length -1].dataset.date;
    const lastCommit = selectCommits[0].dataset.date;

    infoBox.textContent = `First commit: ${firstCommit}\n`;
    infoBox.textContent += `Last commit: ${lastCommit}\n`;
    infoBox.textContent += "\n";
    infoBox.textContent += countAuthorCommits(20);
}

function countAuthorCommits(max) {
    const commits = document.querySelector("#commits");

    const options = commits.options;

    const authorCommits = {};

    options.forEach((option, i) => {
        updateProgressBar(calculatePercent(i, options.length));

        const author = option.dataset.author;

        const count = 1;

        authorCommits[author] ? authorCommits[author] += count : authorCommits[author] = count;
    });

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

    let output = `Top ${max} contributors:\n\n`;

    for(let i = 0; i < v.length; i++) {
        const nr = i + 1;
        const commits = v[i];
        const author = commitsAuthor[commits];

        output += `#${nr}: ${author} (${commits})\n`;
    }

    return output;
}

async function populateFilesystemTree(path, hash) {
    const selectFiles = document.querySelector("#files");
    const checkboxChangedFilesOnly = document.querySelector("#changed_files_only");

    checkboxChangedFilesOnly.checked = false;

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("hash", hash);

    const changedFiles = await fetch('/changes?' + params).then(res => res.json());
    const files = await fetch('/files?' + params).then(res => res.json());

    selectFiles.length = files.length; // creates empty option elements

    files.forEach((file, i) => { // fills them with data
        updateProgressBar(calculatePercent(i, files.length));

        const option = selectFiles[i];

        option.textContent = file.file;
        option.value = file.hash;
        option.dataset.mode = file.mode;
        option.dataset.type = file.type;
        option.dataset.size = file.size;
        option.dataset.change = changedFiles[file.file] || "None";

        option.classList.remove("hide");

        if(i == 0) {
            const hash = option.value;

            console.log(`First file found: '${option.textContent}'`);

            populateFileContent(path, hash);
        }
    });

    selectFiles.selectedIndex = 0; // FIXME: hardcoded value

    hash = selectFiles[0].value;

    updateCommitDetails();
}

function showChangedFiles() {
    const files = document.querySelector("#files");

    const options = files.querySelectorAll("option");

    options.forEach((option) => {
        if(option.dataset.change == "None") {
            option.classList.add("hide");
        }
    });
}

function showAllFiles() {
    const files = document.querySelector("#files");

    const options = files.querySelectorAll("option");

    options.forEach((option) => {
        option.classList.remove("hide");
    });
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

async function populateFileContent(path, hash) {
    const divContent = document.querySelector("#content");
    const checkboxShowDiff = document.querySelector("#show_diff");

    checkboxShowDiff.checked = false;

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("hash", hash);

    const content = await fetch('/content?' + params).then(res => res.text());

    divContent.textContent = content;

    updateFileDetails();
}

async function showDiff(path, hash, file) {
    const divContent = document.querySelector("#content");

    const params = new URLSearchParams();

    params.set("path", path);
    params.set("hash", hash);
    params.set("file", file);

    const diff = await fetch('/diff?' + params).then(res => res.text());

    divContent.textContent = diff;
}

function updateFileDetails() {
    const selectFiles = document.querySelector("#files");

    const option = selectFiles[selectFiles.selectedIndex];

    const spanFileNumber = document.querySelector("#file-number");
    const spanFileHash = document.querySelector("#file-hash");
    const spanFileMode = document.querySelector("#file-mode");
    const spanFileSize = document.querySelector("#file-size");
    const spanFileChange = document.querySelector("#file-change");

    spanFileNumber.textContent = `File: #${(selectFiles.selectedIndex + 1)}/${selectFiles.length}`;
    spanFileHash.textContent = `Hash: ${option.value}`;
    spanFileMode.textContent = `Mode: ${option.dataset.mode}`;
    spanFileSize.textContent = `Size: ${option.dataset.size} Bytes`;
    spanFileChange.textContent = `Change: ${option.dataset.change}`;
}

function main() {
    populateCommitHistory = debounce(populateCommitHistory);
    populateFilesystemTree = debounce(populateFilesystemTree);
    populateFileContent = debounce(populateFileContent);
    filterOptions = debounce(filterOptions);

    const form = document.querySelector("form");

    form.addEventListener("submit", event => event.preventDefault());

    const spanInfo = document.querySelector("#info");

    spanInfo.addEventListener("click", (event) => {
        const infoBox = document.querySelector("#infobox");

        if(infoBox.textContent.length > 0) {
            infoBox.classList.toggle("hide");
        }
    });

    const inputPath = document.querySelector("#path");

    inputPath.addEventListener("keydown", async (event) => {
        if(event.key == "Enter") {
            const path = inputPath.value;

            populateBranches(path);
        }
    });

    const selectBranch = document.querySelector("#branch");

    selectBranch.addEventListener("change", (event) => {
        const path = inputPath.value;

        const branch = selectBranch[selectBranch.selectedIndex].value;

        populateCommitHistory(path, branch);
    });

    inputPath.focus();

    const selectCommits = document.querySelector("#commits");

    selectCommits.addEventListener("change", (event) => {
        const path = inputPath.value;
        const hash = selectCommits.value;

        populateFilesystemTree(path, hash);
    });

    const inputFilterCommits = document.querySelector("#filter-commits");

    inputFilterCommits.addEventListener("keyup", event => filterOptions(event));

    const inputSlider = document.querySelector("#slider");

    inputSlider.addEventListener("change", (event) => {
        selectCommits.selectedIndex = (inputSlider.value - 1);

        const path = inputPath.value;
        const hash = selectCommits.value;

        populateFilesystemTree(path, hash);
    });

    const selectFiles = document.querySelector("#files");

    selectFiles.addEventListener("change", (event) => {
        const path = inputPath.value;
        const hash = selectFiles.value;

        const show_diff = document.querySelector("#show_diff");

        const option = selectFiles[selectFiles.selectedIndex];

        show_diff.disabled = (option.dataset.change == "");

        populateFileContent(path, hash);
    });

    const inputFilterFiles = document.querySelector("#filter-files");

    inputFilterFiles.addEventListener("keyup", event => filterOptions(event));

    const checkboxChangedFilesOnly = document.querySelector("#changed_files_only");

    checkboxChangedFilesOnly.addEventListener("change", event => { checkboxChangedFilesOnly.checked ? showChangedFiles() : showAllFiles() });

    const buttonCheckout = document.querySelector("#checkout");

    buttonCheckout.addEventListener("click", (event) => {
        const content = document.querySelector("#content");

        const filename = basename(selectFiles[selectFiles.selectedIndex].textContent);
        const data = content.textContent;

        saveData(filename, data);
    });

    const checkboxShowDiff = document.querySelector("#show_diff");

    checkboxShowDiff.addEventListener("change", async (event) => {
        const selectFiles = document.querySelector("#files");
        const divContent = document.querySelector("#content");

        const path = inputPath.value;

        if(checkboxShowDiff.checked) {
            const hash = selectCommits.value;
            const file = selectFiles[selectFiles.selectedIndex].textContent;

            showDiff(path, hash, file);
        } else {
            const hash = selectFiles[selectFiles.selectedIndex].value;

            populateFileContent(path, hash);
        }
    });
}

main();
