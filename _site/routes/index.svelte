<script>
  import Images from "../components/Images.island.svelte";
</script>

<svelte:head>
  <title>Mononykus – Deno + Svelte</title>
  <meta
    name="description"
    content="Deploy small websites built with Svelte with islands of interactivity."
  />
</svelte:head>

<body>
  <main>
    <h1>Image Comparison tool</h1>
    <h2>Compare various image qualities and formats</h2>

    <Images />
  </main>
</body>

<style>
  :global(:root) {
    color-scheme: dark;
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
  }
  body {
    background-color: #112;
    color: #ccc;
  }
  main {
    padding: 0 1rem;
    margin: auto;
  }
</style>
