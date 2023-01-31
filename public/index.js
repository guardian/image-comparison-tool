var paths, mediaImgIxToken, salt;

const basePath = "https://i.guim.co.uk/img/media"

function signImgIx(path) {
    return md5(`${mediaImgIxToken}${path}`);
}

function fetchWithTimeout(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        )
    ]);
}

function autoParameter(autoSelected) {
    return autoSelected == "none" ? "" : `&auto=avif,webp`;
}

const isChrome = !!window.chrome && !!window.chrome.webstore;
const pathList = document.getElementById("paths");

function buildUrl(path, listId, params, width) {
    const dpr = params[`dpr-${listId}`];
    const quality = params[`quality-${listId}`];
    const format = params[`format-${listId}`];
    const auto = params[`auto-${listId}`];
    const queryString = `?width=${width}&dpr=${dpr}&quality=${quality}&format=${format}${autoParameter(auto)}`;
    const combined = `${path}${queryString}`
    const imgIxHash = salt ? salt : signImgIx(combined);

    return `${basePath}${path}${queryString}&s=${imgIxHash}`
}

function convertToKb(sizeInBytes) {
    const kb =  Math.round(10*sizeInBytes/1024)/10;
    return kb == 0 ? "unknown ": kb;
}


var params = {}

const elementsWithDirectParameterMapping = [ "dpr-left", "dpr-right", "quality-left", "quality-right", "format-left", "format-right", "auto-left", "auto-right"];

function arrayLookup(array, key, defaultValue) {
    const maybeItem = array.filter((element) => element[0] === key);
    return maybeItem.length > 0 ? maybeItem[0][1] : defaultValue;
}   



function getParams(configFromQueryString) {
    const queryString = window.location.search.substring(1);
    const paramsArray = 
        queryString.split("&")
        .map((keyPair) => keyPair.split("="))
        .map((param) => param[0] === "paths" ? ["paths", param[1].split(",")] : param);
    
    paramsArray.forEach((param) => param[0] ? params[param[0]] = param[1] : "");
    paramsArray
        .filter((param) => elementsWithDirectParameterMapping.includes(param[0]))
        .forEach((param) => param[0] ? document.getElementById(param[0]).value = param[1] : undefined);
    
    pathList.innerHTML = params.paths ? params.paths.join("\n") : "";
    pathList.style.height = 'auto';

    updateImages();

    if (configFromQueryString) {
        // try using query string params
        mediaImgIxToken = arrayLookup(paramsArray, "imgix-token", "missing");
        salt = arrayLookup(paramsArray, "salt", "missing");
    }

}


function paramsToQuerySting() {
    const paramsString = Object.entries(params)
        .map((param) => param[0] == "paths" ? `paths=${param[1].join(",")}` : `${param[0]}=${param[1]}`)
        .join("&");
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

function addListener(eventType, id, listId, paramName) {
    const input = document.getElementById(id);
    input.addEventListener(eventType, function(e){
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

function updateImages() {
    paths = pathList.value.replace(/https:\/\/media.guim.co.uk/g,"").split("\n");
    params["paths"] = paths;
    paramsToQuerySting();
    reloadImageLists();
}

pathList.addEventListener("input", function(e){updateImages();})

addListener("input", "dpr-left", "left", "dpr");
addListener("input", "dpr-right", "right", "dpr");
addListener("input", "quality-left", "left", "quality");
addListener("input", "quality-right", "right", "quality");
addListener("input", "format-left", "left", "format");
addListener("input", "format-right", "right", "format");
addListener("change", "auto-left", "left", "auto");
addListener("change", "auto-right", "right", "auto");


fetchWithTimeout("http://image-comparison-tool.s3-website-eu-west-1.amazonaws.com/config.js", {}, timeout=1000)
.then((resp) => {
    if (resp.status === 200) {
        resp.json().then((json) => {
            mediaImgIxToken = json.mediaImgIxToken;
            getParams(configFromQueryString = false);
            updateImages();
    
        })
    } else {
        getParams(configFromQueryString = true);
        updateImages();
        return Promise.reject("Failed to fetch config - try setting salt= query string parameter to override the salt")
    }
}).catch((err)=>console.log(err))

