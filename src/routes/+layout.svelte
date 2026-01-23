<script>
  let { children } = $props();
</script>

<svelte:head>
  <title>Image Comparison Tool</title>
  <meta
    name="description"
    content="Deploy small websites built with Svelte with islands of interactivity."
  />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/shared.css" />
</svelte:head>

{@render children()}

<style>
  :global(:root) {
  color-scheme: dark;
  font-family:
    ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas,
    "DejaVu Sans Mono", monospace;
}
</style>
