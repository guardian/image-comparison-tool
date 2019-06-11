var paths, fastlyHost, imgIxHost, mediaImgIxToken;

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

const  isChrome = !!window.chrome && !!window.chrome.webstore;
const pathList = document.getElementById("paths");
const hostRadiosLeft = document.getElementsByName("originHost-left");
const hostRadiosRight = document.getElementsByName("originHost-right");
const hostMapping = [
    {
        name: "host-left",
        element: hostRadiosLeft
    },
    {
        name: "host-right",
        element: hostRadiosRight
    }
]

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

const elementsWithDirectParameterMapping = [ "dpr-left", "dpr-right", "quality-left", "quality-right"];

function setHostRadioButton(buttonGroup, value) {
    if (value === "imgix") {
        buttonGroup[0].checked = true;
        buttonGroup[1].checked = false;
    } else {
        buttonGroup[0].checked = false;
        buttonGroup[1].checked = true;
    }
}

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
    console.log("setting paths", params.paths.join("\n"))
    pathList.innerHTML = params.paths ? params.paths.join("\n") : "";
    pathList.style.height = 'auto';
    // set imgix/fastly radio buttons
    hostMapping.forEach((host) => {
        const value = arrayLookup(paramsArray, host.name, "imgix");
        setHostRadioButton(host.element, value);
        params[host.name] = value;
    });

    if (configFromQueryString) {
            // try using query string params
        fastlyHost = arrayLookup(paramsArray, "fastly-host", "missing");
        imgIxHost = arrayLookup(paramsArray, "imgix-host", "missing");
        mediaImgIxToken = arrayLookup(paramsArray, "imgix-token", "missing");
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

function updateImages() {
    paths = pathList.value.replace(/https:\/\/media.guim.co.uk/g,"").split("\n");
    params["paths"] = paths;
    paramsToQuerySting();
    reloadImageLists();
}

function updateHost(name, index) {
    if (index == 0) {
        params[name] = "imgix"
    } else if (index === 1) {
        params[name] = "fastly"
    }
}

hostMapping.forEach((host) => {
    host.element.forEach((r, index) => r.addEventListener("input", (e) => {
        updateHost(host.name, index);
        updateImages();
    }))
})

hostRadiosLeft.forEach((r, index) => r.addEventListener("input", (e) => updateImages()))
hostRadiosRight.forEach((r, index) => r.addEventListener("input", (e) => updateImages()))

pathList.addEventListener("input", function(e){updateImages();})

addListener("dpr-left", "left", "dpr");
addListener("quality-left", "left", "quality");
addListener("dpr-right", "right", "dpr");
addListener("quality-right", "right", "quality");


fetchWithTimeout("http://image-comparison-tool.s3-website-eu-west-1.amazonaws.com/config.js", {}, timeout=1000)
.then((resp) => {
    if (resp.status === 200) {
        resp.json().then((json) => {
            imgIxHost = json.fastlyCodeHost;
            fastlyHost = json.fastlyProdHost;
            mediaImgIxToken = json.mediaImgIxToken;
            getParams(configFromQueryString = false);
            updateImages();
    
        })
    } else {
        getParams(configFromQueryString = true);
        updateImages();
        return Promise.reject("Failed to fetch config - try setting fastly-host,imgix-host and imgix-token in query string.")
    }
}).catch((err)=>console.log(err))

