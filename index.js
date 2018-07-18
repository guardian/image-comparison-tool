const imagePaths = [
    "/b88460d0528a530aadbd8f3e1eaad56e249ac57e/0_131_5760_3456/5760.jpg",
    "/2ab16f715d5a468f4566eaef27ed40077c053f21/813_889_1971_1183/1971.jpg"];
const imageUrls = imagePaths.map(path => `${imageHost}${path}`);
console.log(imageUrls);

function buildQueryString(params) {
    return `?dpr=${params.dpr}&quality=${params.quality}`;
}

const defaultValues = {
    dpr: 1.0,
    quality: 20
}

var params = {
    left: defaultValues,
    right: defaultValues
}

function updateList(listId, newParams) {
    const listToUpdate = document.getElementById(listId)
    const source   = document.getElementById("imageList").innerHTML;
    const listTemplate = Handlebars.compile(source);

    const newUrls = imageUrls.map(url => `${url}${buildQueryString(newParams)}`);
    const sizes = Promise.all(newUrls.map(url => axios.get(url).then(response => response.headers["content-length"])))
        .then((imageSizes)=> {
            //const sizeInKb = Math.round(imageSizes[i]/1024);
            const combined = newUrls.map((url,i) => {return {url: url, size: Math.round(imageSizes[i]/1024)}});
            console.log(combined);
            const listHtml = listTemplate({images: combined});
            listToUpdate.innerHTML = listHtml;
            
        });    
}


console.log("Hello! I compare images.")

function addListener(id, listId, paramName) {
    const input = document.getElementById(id);
    input.addEventListener("input", function(e){
        const value = input.value;
        params[listId][paramName] = value;
        console.log(params);
        updateList(listId, params[listId]);
    })
}

addListener("dpr-left", "left", "dpr");
addListener("quality-left", "left", "quality");
addListener("dpr-right", "right", "dpr");
addListener("quality-right", "right", "quality");

updateList("left", params.left);
updateList("right", params.right);