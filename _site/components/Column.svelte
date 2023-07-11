<script>
  /** @type {{ format: 'avif' | 'webp' | 'png8' | 'pjpg', dpr: 1 | 2, quality: number }} */
  export let config;

  /** @type {number} */
  export let width;

  /** @type {() => void} */
  export let updateQueryParam;

  /** @type {Array<URL>}*/
  export let urls;

  /** @type {(src: URL) => number}*/
  const ratio = (src) => {
    const [, , , , crop] = src.pathname.split("/");
    if (!crop) return 1;
    const [width, height] = crop.split("_").slice(2);
    return height / width;
  };

  /** @param {Blob} blob */
  const blobToDataUri = (blob) =>
    new Promise((resolve) => {
      let reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.readAsDataURL(blob);
    });

  const format_size = (size) => `${(size / 1000).toFixed(1)} kB`;

  const unwrap = async (url) => {
    const searchParams = new URLSearchParams({
      format: config.format,
      dpr: String(config.dpr),
      quality: String(config.quality),
      width,
      s: "none",
    });
    const src = new URL(`${url.href}?${searchParams}`);

    const blob = await fetch(src, {
      headers: {
        // TODO: get headers from actual browsing session!
        Accept: [
          "image/avif",
          "image/webp",
          "image/png",
          "image/svg+xml",
          "image/*",
        ].join(","),
      },
    }).then((r) => r.blob());

    const { size, type } = blob;

    const dataUri = await blobToDataUri(blob);

    return { size, type, dataUri, src };
  };

  const handleChange = () => {
    updateQueryParam();
    urls = urls;
  };
</script>

<li class="config">
  <label>
    DPR
    <input
      type="number"
      min="1"
      max="2"
      step="1"
      bind:value={config.dpr}
      on:change={handleChange}
    />
  </label>

  <label>
    Quality
    <input
      type="number"
      min="0"
      max="120"
      step="1"
      bind:value={config.quality}
      on:change={handleChange}
    />
  </label>

  <label>
    Format

    <select bind:value={config.format} on:change={handleChange}>
      {#each ["avif", "webp", "png8", "pjpg"] as image_format}
        <option value={image_format} selected={image_format === config.format}>
          {image_format}
        </option>
      {/each}
    </select>
  </label>
</li>
{#await Promise.all(urls.map(unwrap))}
  <li style={`grid-row-end: span ${urls.length + 1}; width: ${width}px;`}>
    …loading
  </li>
{:then sources}
  <li>
    Total: {format_size(sources.reduce((acc, { size }) => acc + size, 0))}
  </li>
  {#each sources as { src, dataUri, size, type } (src.href)}
    <li>
      <figure>
        <img
          src={dataUri}
          {width}
          height={Math.round(ratio(src) * width)}
          alt=""
        />
        <figcaption>
          <span><a href={src.href}>{type}</a></span>

          <span>
            {format_size(size)}
          </span>
        </figcaption>
      </figure>
    </li>
  {/each}
{/await}

<style>
  li {
    list-style-type: none;
    display: flex;
    gap: 12px;
  }

  figure {
    margin: 0;
  }

  figure img {
    display: block;
  }

  figcaption {
    display: flex;
    justify-content: space-between;
  }

  li.config {
    display: flex;
    flex-direction: column;
    position: sticky;
    padding: 12px 0;
    top: 0;
    background-color: #112c;
  }
</style>
