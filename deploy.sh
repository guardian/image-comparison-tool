# build project
deno run -A https://deno.land/x/mononykus@0.6.1/src/build.ts

# upload project
aws s3 sync build/ s3://image-comparison-tool/ --profile frontend