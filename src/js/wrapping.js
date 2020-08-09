const fs = require('fs');

const createHtml = (css, content) => {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" type="text/css" href="${css}" >
</head>
<body>
<div id="preview" class="container">
${content}
</div>
</body>
</html>
`};

const exportHtml = (filepath, csspath, content) => {
    fs.writeFileSync(filepath, createHtml(csspath, content));
}

module.exports = { exportHtml };