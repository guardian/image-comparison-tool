Image comparison tool
=====================

This tool makes it easy to compare different DPR/Quality parameters of images. The guardian will use this to work out what values to set for these parameters to get the optimum size/quality ratio.

It's a static site using handlebars js and materialize css.

To run it locally, you'll need to create a file called config.js with this line in it:

`const mediaImgIxToken = salt for images from the fastly image vcl`

Alternatively just set `salt=<override value for image salt urls>`