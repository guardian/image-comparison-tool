var paths;

function signImgIx(path) {
    return md5(`${mediaImgIxToken}${path}`);
}

const hostRadiosLeft = document.getElementsByName("originHost-left");
const hostRadiosRight = document.getElementsByName("originHost-right");


const  isChrome = !!window.chrome && !!window.chrome.webstore;

function switchOnHost(imgixValue, fastlyValue) {
    return {
        left: hostRadiosLeft[0].checked ? imgixValue : fastlyValue,
        right:hostRadiosRight[0].checked ? imgixValue : fastlyValue
    }
}

function getHost() {
    return switchOnHost(imgIxHost, fastlyHost)
}

function widthParam() {
    return switchOnHost("w", "width");
}

function qualityParam() {
    return switchOnHost("q", "quality");
}

function autoFormatValue() {
    return switchOnHost("format", "webp");
}

function forceWebPParams() {
    return isChrome ? "&fm=webp&format=webp" : "";
}

function buildUrl(path, listId, params, width) {
    const dpr = params[`dpr-${listId}`];
    const quality = params[`quality-${listId}`];
    const queryString = `?${widthParam()[listId]}=${width}&dpr=${dpr}&${qualityParam()[listId]}=${quality}&auto=${autoFormatValue()[listId]}${forceWebPParams()}`;
    const combined = `${path}${queryString}`
    const imgIxHash = signImgIx(combined);
    return `${getHost()[listId]}${path}${queryString}&s=${imgIxHash}`
}

function convertToKb(sizeInBytes) {
    const kb =  Math.round(10*sizeInBytes/1024)/10;
    return kb == 0 ? "unknown ": kb;
}


var params = {}

function getParams() {
    const queryString = window.location.search.substring(1);
    console.log(queryString);
    const paramsArray = 
        queryString.split("&")
        .map((keyPair) => keyPair.split("="))
        .map((param) => param[0] === "paths" ? ["paths", param[1].split(",")] : param);
    paramsArray.forEach((param) => param[0] ? params[param[0]] = param[1] : "");
    console.log(paramsArray);
    paramsArray.forEach((param) => param[0] ? document.getElementById(param[0]).value = param[1] : undefined);
    document.getElementById("paths").value = params.paths ? params.paths.join("\n") : "";
}
getParams();

function paramsToQuerySting() {
    const paramsString = Object.entries(params)
        .map((param) => param[0] == "paths" ? `paths=${param[1].join(",")}` : `${param[0]}=${param[1]}`)
        .join("&");
    console.log(paramsString);
    if (history.pushState) {
        const newurl = window.location.origin + window.location.pathname + `?${paramsString}`;
        window.history.pushState({path:newurl},'',newurl);
    }
}

function extractLengthAndType(response) {
    return {
        imageType: response.headers.get("content-type"),
        length: response.headers.get("content-length")
        }
}

function updateList(listId, newParams) {
    const listToUpdate = document.getElementById(listId)
    const source   = document.getElementById("imageList").innerHTML;
    const listTemplate = Handlebars.compile(source);

    const newUrls = newParams.paths.map(url => {
    return {
        normal: `${buildUrl(url, listId, newParams, 620)}`,
        thumbnail: `${buildUrl(url, listId, newParams, 140)}`
        }
    });
    const sizes = Promise.all(newUrls.map(urls => {
        return Promise.all([
            fetch(urls.normal).then(extractLengthAndType),
            fetch(urls.thumbnail).then(extractLengthAndType)
        ])
        }))
        .then((imageSizes)=> {
            const combined = newUrls.map((urls,i) => {
                return {
                    normal: {
                        url: urls.normal, size: convertToKb(imageSizes[i][0].length), imageType: imageSizes[i][0].imageType
                    },
                    thumbnail: {
                      url: urls.thumbnail, size: convertToKb(imageSizes[i][1].length), imageType: imageSizes[i][1].imageType
                    }}
                });
            const listHtml = listTemplate({images: combined});
            listToUpdate.innerHTML = listHtml;
            
        });    
}


console.log("Hello! I compare images.")

function addListener(id, listId, paramName) {
    const input = document.getElementById(id);
    input.addEventListener("input", function(e){
        const value = input.value;
        params[`${paramName}-${listId}`] = value;
        console.log(params);
        updateList(listId, params);
        paramsToQuerySting();
    })
}

function reloadImageLists(){
    updateList("left", params);
    updateList("right", params);
}

const pathList = document.getElementById("paths");
function updateImages() {
    paths = pathList.value.replace(/https:\/\/media.guim.co.uk/g,"").split("\n");
    params["paths"] = paths;
    paramsToQuerySting();
    reloadImageLists();
}


hostRadiosLeft.forEach((r) => r.addEventListener("input", (e) => updateImages()))
hostRadiosRight.forEach((r) => r.addEventListener("input", (e) => updateImages()))

pathList.addEventListener("input", function(e){updateImages();})

addListener("dpr-left", "left", "dpr");
addListener("quality-left", "left", "quality");
addListener("dpr-right", "right", "dpr");
addListener("quality-right", "right", "quality");

updateImages();
