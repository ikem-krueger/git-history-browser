const httpRequest = async (url, data, type) => {
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

function dropCommitHistory() {
    let history = document.querySelector("#history");
    
    history.innerHTML = "";
}

async function populateCommitHistory() {
    let history = document.querySelector("#history");

    let path = document.querySelector("#path").value;

    let orderByLastCommit = false;
    
    let messages = await httpRequest(host + '/history', { path: path }, type="json");

    messages.forEach(item => {
        let option = document.createElement("option");
        
        option.value = item.hash;
        option.innerText = item.message;
        
        orderByLastCommit ? history.append(option) : history.prepend(option);
    });
    
    history.selectedIndex = 0;
    
    let slider = document.querySelector("#slider");
    
    slider.min = 1;
    slider.value = history.selectedIndex + 1;
    slider.max = history.length; // FIXME

    dropFilesystemTree();
    populateFilesystemTree();
}

function dropFilesystemTree() {
    let tree = document.querySelector("#tree");

    tree.innerHTML = "";
}

async function populateFilesystemTree() {
    let history = document.querySelector("#history");
    let tree = document.querySelector("#tree");

    let path = document.querySelector("#path").value;
    let commit = history.value;
    
    let files = await httpRequest(host + '/tree', { path: path, commit: commit }, type="json");

    files.forEach(item => {
        let option = document.createElement("option");
        
        option.value = item.hash;
        option.innerText = item.file;
        
        tree.append(option);
    });

    tree.selectedIndex = 0; // FIXME: hardcoded value

    dropFileContent();
    populateFileContent();
}

function dropFileContent(){
    let file = document.querySelector("#file");
    
    file.innerHTML = "";
}

async function populateFileContent() {
    let tree = document.querySelector("#tree");
    let file = document.querySelector("#file");
    
    let path = document.querySelector("#path").value;
    let commit = tree.value;

    let content = await httpRequest(host + '/file', { path: path, commit: commit }, type="text");

    file.value = content;
}

function main() {
    let path = document.querySelector("#path");
    
    path.value = repo;
    
    path.addEventListener("keydown", (event) => { if(event.key == "Enter") { dropCommitHistory(); populateCommitHistory(); event.preventDefault(); }});

    let history = document.querySelector("#history");

    history.addEventListener("change", (event) => { slider.value = (history.selectedIndex + 1); });
    history.addEventListener("change", (event) => { dropFilesystemTree(); populateFilesystemTree(); });

    populateCommitHistory();

    let filterCommits = document.querySelector("#filter-commits");
	
	filterCommits.addEventListener("keydown", (event) => { if(event.key == "Enter") event.preventDefault(); });

    filterCommits.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        let all = document.querySelectorAll("#history option")

        for(let i of all) {
            let item = i.innerHTML.toLowerCase();
            
			item.indexOf(search) == -1 ? i.classList.add("hide") : i.classList.remove("hide");
        }
		
		event.preventDefault();
    });

    let slider = document.querySelector("#slider");
    
    slider.min = 1;
    slider.value = history.selectedIndex + 1;
    slider.max = history.length; // FIXME

    slider.addEventListener("change", (event) => { history.selectedIndex = (slider.value - 1); });
    slider.addEventListener("change", (event) => { dropFilesystemTree(); populateFilesystemTree(); });
    
    let tree = document.querySelector("#tree");
    
    tree.addEventListener("change", (event) => { dropFileContent(); populateFileContent(); });

    let filterFiles = document.querySelector("#filter-files");
	
	filterFiles.addEventListener("keydown", (event) => { if(event.key == "Enter") event.preventDefault(); });

    filterFiles.addEventListener("keyup", (event) => {
        let search = event.target.value.toLowerCase();

        let all = document.querySelectorAll("#tree option")

        for(let i of all) {
            let item = i.innerHTML.toLowerCase();
            
			item.indexOf(search) == -1 ? i.classList.add("hide") : i.classList.remove("hide");
        }
		
		event.preventDefault();
    });
}

var port = "3000";
var host = `http://localhost:${port}`;

var repo = "C:\\Users\\ethinking\\source\\repos\\git-log-tree-viewer";

main();
