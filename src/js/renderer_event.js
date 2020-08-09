window.api.on('md2html/o', (args) => {
  const preview = document.getElementById("preview").innerHTML = args.html;
  const elements = document.getElementsByTagName("a");
  for (var i = 0; i < elements.length; ++i) {
    elements[i].onclick = (event) => {
      const self = (event.target || event.srcElement);
      const anchor = document.getElementById(self.href.replace(/^.*[\#]/, '')).getBoundingClientRect();
      document.getElementById('preview').scrollTop += anchor.top + window.pageYOffset - (24 + 14);
      return false;
    }
  }
});
const darkmode = new Darkmode();
window.api.on('set-monaco-theme', (args) => {
  const theme = args.theme;
  if ((theme == 'vs' && darkmode.isActivated()) || (theme == 'vs-dark' && !darkmode.isActivated()))
    darkmode.toggle();
  monaco.editor.setTheme(theme)
});
window.api.on('set-monaco-value', (args) => {
  const value = args.value;
  const filename = args.filename;
  document.getElementById("editor_filename").innerHTML = `${filename}`;
  editor.setModel(monaco.editor.createModel(value, 'markdown'));
  window.api.send('md2html/i', { md: editor.getValue() });
});
window.api.on('get-monaco-value', (args) => {
  window.api.send('save-monaco-value', { value: editor.getValue(), reload: args.reload });
});

window.api.on('undo', (args) => {
  editor.trigger('aaaa', 'undo', 'aaaa');
  editor.focus();
})

window.api.on('redo', (args) => {
  editor.trigger('aaaa', 'redo', 'aaaa');
  editor.focus();
})