# creates build/html
rm -r build -errorAction ignore
$d = mkdir build
$d = mkdir build/html
cp -r Notes/Content build/html/
cp -r Notes/*.html build/html/
cp -r Notes/*.css build/html/
cp -r Notes/*.gif build/html/


