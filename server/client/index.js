const httpRequest = async (url, format) => {
    try {
        const response = await fetch(url);

		if(format == "json") {
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

	let orderByLastCommit = true;
	
	let messages = await httpRequest(host + '/history', format="json");

	messages.forEach(item => {
		let option = document.createElement("option");
		
		option.value = item.hash;
		option.innerText = item.message;
		
		orderByLastCommit ? history.append(option) : history.prepend(option);
	});
	
	history.selectedIndex = 0; // FIXME: hardcoded value

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
	
	let files = await httpRequest(host + '/tree', format="json");

	files.forEach(item => {
		let option = document.createElement("option");
		
		option.value = item.hash;
		option.innerText = item.file;
		
		tree.append(option);
	});

	tree.selectedIndex = 0; // FIXME: hardcoded value

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

	let content = await httpRequest(host + '/file', format="text");

	file.value = content;
}

function main() {
	let history = document.querySelector("#history");

	history.addEventListener("change", (event) => { slider.value = (history.selectedIndex + 1); });
	history.addEventListener("change", (event) => { dropFilesystemTree(); populateFilesystemTree(); });

	populateCommitHistory();

	let slider = document.querySelector("#slider");
	
	slider.min = 1;
	slider.value = history.selectedIndex + 1;
	slider.max = history.length; // FIXME

	slider.addEventListener("change", (event) => { history.selectedIndex = (slider.value - 1); });
	slider.addEventListener("change", (event) => { dropFilesystemTree(); populateFilesystemTree(); });
	
	let tree = document.querySelector("#tree");
	
	tree.addEventListener("change", (event) => { dropFileContent(); populateFileContent(); });
}

var port = "3000";
var host = `http://localhost:${port}`;

main();
