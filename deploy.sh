# build project
dvm use
deno run run -A jsr:@mxdvl/mononykus@0.7.5

# upload project
aws s3 sync build/ s3://image-comparison-tool/ --profile frontend
