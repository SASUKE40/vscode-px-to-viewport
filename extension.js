// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  var disposable = vscode.commands.registerTextEditorCommand(
    'extension.vwToPx',
    function(textEditor, textEditorEdit) {
      const config = vscode.workspace.getConfiguration('px-to-viewport');
      const viewportWidth = config.get('viewport-width');
      var regexStr = '([0-9]*\\.?[0-9]+)vw';
      placeholder(
        regexStr,
        (match, value) => `${vw2Px(value, viewportWidth)}px`,
        textEditor,
        textEditorEdit
      );
    }
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerTextEditorCommand(
    'extension.pxToVw',
    function(textEditor, textEditorEdit) {
      const config = vscode.workspace.getConfiguration('px-to-viewport');
      const viewportWidth = config.get('viewport-width');
      var regexStr = '([0-9]*\\.?[0-9]+)px';
      placeholder(
        regexStr,
        (match, value) => `${px2Vw(value, viewportWidth)}vw`,
        textEditor,
        textEditorEdit
      );
    }
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerTextEditorCommand(
    'extension.pxToVwAndVwToPx',
    function(textEditor, textEditorEdit) {
      const config = vscode.workspace.getConfiguration('px-to-viewport');
      const viewportWidth = config.get('viewport-width');
      var regexStr = '([0-9]*\\.?[0-9]+)(px|vw)';
      placeholder(
        regexStr,
        (match, value, unit) =>
          unit == 'px'
            ? `${px2Vw(value, viewportWidth)}vw`
            : `${vw2Px(value, viewportWidth)}px`,
        textEditor,
        textEditorEdit
      );
    }
  );
  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function px2Vw(px, viewportWidth) {
  if (viewportWidth == 0) {
    return 0;
  }
  const config = vscode.workspace.getConfiguration('px-to-viewport');
  var maxDecimals = config.get('number-of-decimals-digits');
  maxDecimals = Math.max(1, maxDecimals);
  const value = parseFloat((px / viewportWidth * 100).toFixed(maxDecimals));
  return value;
}
function vw2Px(vw, viewportWidth) {
  const config = vscode.workspace.getConfiguration('px-to-viewport');
  var maxDecimals = config.get('number-of-decimals-digits');
  maxDecimals = Math.max(1, maxDecimals);
  const value = parseFloat((vw * viewportWidth / 100).toFixed(maxDecimals));
  return value;
}

function placeholder(regexString, replaceFunction, textEditor, textEditorEdit) {
  let regexExp = new RegExp(regexString);
  let regexExpG = new RegExp(regexString, 'g');
  // Check if there is some text selected
  const selections = textEditor.selections;
  if (
    (selections.length == 0 ||
      selections.reduce((acc, val) => acc || val.isEmpty),
    false)
  ) {
    return;
  }
  // Get configuration options
  const config = vscode.workspace.getConfiguration('px-to-viewport');
  const onlyChangeFirst = config.get('only-change-first-ocurrence');
  const warningIfNoChanges = config.get('notify-if-no-changes');

  // Declaration of auxiliar variables
  let numOcurrences = 0;
  selections.forEach(function(selection) {
    if (selection.isEmpty) {
      return;
    }
    // Iterates over each selected line
    for (
      var index = selection.start.line;
      index <= selection.end.line;
      index++
    ) {
      let start, end;
      // Gets the first and last selected characters for the line
      start = index == selection.start.line ? selection.start.character : 0;
      end =
        index == selection.end.line
          ? selection.end.character
          : textEditor.document.lineAt(index).range.end.character;
      // Gets the text of the line
      let text = textEditor.document.lineAt(index).text.slice(start, end);
      // Counts the number of thimes the regex appears in the line
      const matches = text.match(regexExpG);
      numOcurrences += matches ? matches.length : 0;
      if (numOcurrences == 0) {
        continue;
      } // No ocurrences, so it's worth continuing
      const regex = onlyChangeFirst ? regexExp : regexExpG;
      //
      const newText = text.replace(regex, replaceFunction);
      // Replace text in the text file
      const selectionTmp = new vscode.Selection(index, start, index, end);
      textEditorEdit.replace(selectionTmp, newText);
    }
    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World!');
    return;
  }, this);
  if (warningIfNoChanges && numOcurrences == 0) {
    vscode.window.showWarningMessage('There were no values to transform');
  }
}

exports.deactivate = deactivate;
