<script>
  import Column from "./Column.svelte";

  const IS_BROWSER = typeof document !== "undefined";

  /** @type {string} */
  let input =
    "img/media/d9ede9177cd8a01c7a7e87da54fb15e0615adf20/0_1597_6000_3599/master/6000.jpg";

  let width = (IS_BROWSER ? Number() : undefined) || 320;

  $: urls = input
    .split("\n")
    .filter(Boolean)
    .map((path) => new URL(path, "https://fastly-io-code.guim.co.uk"));

  /** @type {Config} */
  let configs = [
    {
      dpr: 1,
      quality: 85,
      format: "pjpg",
    },
    {
      dpr: 1,
      quality: 80,
      format: "png8",
    },
    {
      dpr: 2,
      quality: 25,
      format: "webply",
    },
    {
      dpr: 2,
      quality: 55,
      format: "avif",
    },
  ];

  const updateQueryParam = () => {
    window.history.replaceState(
      {},
      "",
      "?" +
        new URLSearchParams({
          width: String(width),
          configs: JSON.stringify(configs),
          paths: input.replaceAll("\n", "+"),
        })
    );
    configs = configs;
  };

  const parseValues = () => {
    input =
      new URLSearchParams(window.location.search)
        .get("paths")
        ?.replaceAll("+", "\n") ?? input;
    width = Number(
      new URLSearchParams(window.location.search).get("width") ?? width
    );
    configs = JSON.parse(
      new URLSearchParams(window.location.search).get("configs") ??
        JSON.stringify(configs)
    );
  };

  IS_BROWSER && parseValues();
</script>

<label>
  Enter i.guim.co.uk URLs crops below, each on its own line:<br />
  <textarea
    cols="120"
    rows="12"
    bind:value={input}
    on:input={updateQueryParam}
  />
</label>

<hr />

<label>
  Width
  <input
    type="number"
    max="1300"
    step="10"
    bind:value={width}
    on:input={() => {
      updateQueryParam();
      // reload everything!
      urls = urls;
    }}
  />
</label>

<hr />

<ul style:--count={urls.length + 2}>
  {#each configs as config}
    <Column {config} {width} {urls} {updateQueryParam} />
  {/each}
</ul>

<style>
  ul {
    display: grid;
    grid-template-rows: repeat(var(--count), auto);
    grid-auto-flow: column;
    grid-auto-columns: auto;
    padding: 0;
    gap: 36px;
    overflow-x: scroll;
  }

  label {
    display: block;
  }

  textarea {
    max-width: 90vw;
  }
</style>
