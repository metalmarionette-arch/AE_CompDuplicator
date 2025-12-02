function buildUI(thisObj) {
  var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Duplicate Comps with Expressions", undefined);
  myPanel.orientation = "column";

  var renameGroup = myPanel.add("group", undefined);
  renameGroup.orientation = "column";
  renameGroup.alignment = "left";

  renameGroup.add("statictext", undefined, "【置換文字列1】");

  var replace1BeforeGroup = renameGroup.add("group", undefined);
  replace1BeforeGroup.add("statictext", undefined, "置換前：");
  var replace1Before = replace1BeforeGroup.add("edittext", undefined, "");
  replace1Before.characters = 20;

  var replace1AfterGroup = renameGroup.add("group", undefined);
  replace1AfterGroup.add("statictext", undefined, "置換後：");
  var replace1After = replace1AfterGroup.add("edittext", undefined, "");
  replace1After.characters = 20;

  renameGroup.add("statictext", undefined, "【置換文字列2】");

  var replace2BeforeGroup = renameGroup.add("group", undefined);
  replace2BeforeGroup.add("statictext", undefined, "置換前：");
  var replace2Before = replace2BeforeGroup.add("edittext", undefined, "");
  replace2Before.characters = 20;

  var replace2AfterGroup = renameGroup.add("group", undefined);
  replace2AfterGroup.add("statictext", undefined, "置換後：");
  var replace2After = replace2AfterGroup.add("edittext", undefined, "");
  replace2After.characters = 20;

  renameGroup.add("statictext", undefined, "【前後の文字列追加】");

  var addBeforeGroup = renameGroup.add("group", undefined);
  addBeforeGroup.add("statictext", undefined, "前追加：");
  var addBefore = addBeforeGroup.add("edittext", undefined, "");
  addBefore.characters = 20;

  var addAfterGroup = renameGroup.add("group", undefined);
  addAfterGroup.add("statictext", undefined, "後追加：");
  var addAfter = addAfterGroup.add("edittext", undefined, "");
  addAfter.characters = 20;

  // --- フッテージ差し替えオプション ---
  var optionGroup = renameGroup.add("group", undefined);
  optionGroup.orientation = "row";
  optionGroup.alignment = "left";
  var replaceFootageCheckbox = optionGroup.add("checkbox", undefined, "コンポ内フッテージも差し替え");
  replaceFootageCheckbox.value = true;
  // ------------------------------------------

  var groupOne = myPanel.add("group", undefined, "GroupOne");
  groupOne.orientation = "row";
  var duplicateButton = groupOne.add("button", undefined, "コンポジションの複製");

  duplicateButton.onClick = function() {
    main_sugi({
      replace: [
        { from: replace1Before.text, to: replace1After.text },
        { from: replace2Before.text, to: replace2After.text },
      ],
      add: { before: addBefore.text, after: addAfter.text },
      replaceFootage: replaceFootageCheckbox.value
    });
  };

  myPanel.layout.layout(true);
  myPanel.layout.resize();
  myPanel.onResizing = myPanel.onResize = function () { this.layout.resize(); }

  return myPanel;
}

var myScriptPal = buildUI(this);

if ((myScriptPal != null) && (myScriptPal instanceof Window)) {
  myScriptPal.center();
  myScriptPal.show();
}

//////////////////////////////////////////////////
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

// 【修正点】連番部分を除去する関数を強化
function getBaseName(name) {
  // [_\s]* : アンダースコアまたはスペースが0個以上ある
  // \[\d+-\d+\] : [0-99] のような連番表記
  // .*$         : その後ろにある拡張子や文字すべて
  // これらを空文字に置換して、純粋なファイル名のベースを取得する
  return name.replace(/[_\s]*\[\d+-\d+\].*$/, "");
}

function findCompByName(name) {
  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof CompItem && item.name === name) {
      return item;
    }
  }
  return null;
}

function findTargetItem(targetName) {
  var targetBaseName = getBaseName(targetName);
  var bestMatch = null;

  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    
    // 1. 完全一致
    if (item.name === targetName) {
      return item;
    }

    // 2. ベース名一致 (連番違い)
    if (!bestMatch && item instanceof FootageItem) {
        if (getBaseName(item.name) === targetBaseName) {
            bestMatch = item;
        }
    }
  }
  
  return bestMatch;
}

function updatePropertyExpressions(prop, compNameMap) {
  if (prop.propertyType === PropertyType.PROPERTY) {
    if (prop.canSetExpression && prop.expression) {
      var updatedExpression = prop.expression;
      for (var originalName in compNameMap) {
        var duplicatedName = compNameMap[originalName];
        var compRegex = new RegExp('\\bcomp\\(["\']' + escapeRegExp(originalName) + '["\']\\)', 'g');
        updatedExpression = updatedExpression.replace(compRegex, 'comp("' + duplicatedName + '")');
        var layerRegex = new RegExp('\\blayer\\(["\']' + escapeRegExp(originalName) + '["\']\\)', 'g');
        updatedExpression = updatedExpression.replace(layerRegex, 'layer("' + duplicatedName + '")');
      }
      if (updatedExpression !== prop.expression) {
        prop.expression = updatedExpression;
      }
    }
  } else if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
    for (var i = 1; i <= prop.numProperties; i++) {
      updatePropertyExpressions(prop.property(i), compNameMap);
    }
  }
}

function replaceNestedSources(layer, compNameMap, renameOptions) {
  if (layer.source instanceof CompItem) {
    var newCompName = compNameMap[layer.source.name];
    if (newCompName) {
      var newComp = findCompByName(newCompName);
      if (newComp) {
        layer.replaceSource(newComp, true);
      }
    }
  }
  else if (renameOptions.replaceFootage && (layer.source instanceof FootageItem)) {
    var currentName = layer.source.name;
    var newName = currentName;

    // 文字列置換
    for (var j = 0; j < renameOptions.replace.length; j++) {
      var replaceOption = renameOptions.replace[j];
      if (replaceOption.from !== "") {
        var re = new RegExp(escapeRegExp(replaceOption.from), 'g');
        newName = newName.replace(re, replaceOption.to);
      }
    }

    if (newName !== currentName) {
      // 強化された検索ロジックを使用
      var targetItem = findTargetItem(newName);
      
      if (targetItem && targetItem instanceof FootageItem) {
        if (layer.source.id !== targetItem.id) {
             layer.replaceSource(targetItem, false);
        }
      }
    }
  }
}

function duplicateCompWithRename(comp, renameOptions) {
  var duplicatedComp = comp.duplicate();
  var renamedName = comp.name;
  var isNameChanged = false; 

  for (var j = 0; j < renameOptions.replace.length; j++) {
    var replaceOption = renameOptions.replace[j];
    if (replaceOption.from !== "") {
        var newRenamedName = renamedName.replace(new RegExp(replaceOption.from, 'g'), replaceOption.to);
        if (newRenamedName !== renamedName) { 
            isNameChanged = true;
        }
        renamedName = newRenamedName;
    }
  }

  renamedName = renameOptions.add.before + renamedName + renameOptions.add.after;
  
  if (renamedName === comp.name && !isNameChanged) { 
    renamedName = comp.name + "_copy";
  }

  duplicatedComp.name = renamedName;
  return duplicatedComp;
}

function duplicateFolderContents(folder, renameOptions, compNameMap) {
  if (!compNameMap) {
    compNameMap = {};
  }
  var items = folder.items;

  var renamedFolderName = folder.name;
  for (var j = 0; j < renameOptions.replace.length; j++) {
    var replaceOption = renameOptions.replace[j];
    if (replaceOption.from !== "") {
        renamedFolderName = renamedFolderName.replace(replaceOption.from, replaceOption.to);
    }
  }
  renamedFolderName = renameOptions.add.before + renamedFolderName + renameOptions.add.after;

  var duplicatedFolder = app.project.items.addFolder(renamedFolderName !== folder.name ? renamedFolderName : folder.name + "_copy");
  duplicatedFolder.parentFolder = folder.parentFolder;

  for (var i = 1; i <= items.length; i++) {
    var item = items[i];
    if (item instanceof CompItem) {
      var duplicateComp = item.duplicate();
      duplicateComp.parentFolder = duplicatedFolder;
      var renamedCompName = item.name;
      for (var j = 0; j < renameOptions.replace.length; j++) {
        var replaceOption = renameOptions.replace[j];
        if (replaceOption.from !== "") {
             renamedCompName = renamedCompName.replace(replaceOption.from, replaceOption.to);
        }
      }
      renamedCompName = renameOptions.add.before + renamedCompName + renameOptions.add.after;
      duplicateComp.name = renamedCompName !== item.name ? renamedCompName : item.name + "_copy";
      compNameMap[item.name] = duplicateComp.name;
    } else if (item instanceof FolderItem) {
      var duplicateSubfolder = duplicateFolderContents(item, renameOptions, compNameMap);
      duplicateSubfolder.parentFolder = duplicatedFolder;
    }
  }

  for (var compName in compNameMap) {
    var duplicatedComp = findCompByName(compNameMap[compName]);
    if (duplicatedComp) {
      for (var j = 1; j <= duplicatedComp.numLayers; j++) {
        var layer = duplicatedComp.layer(j);
        updatePropertyExpressions(layer, compNameMap);
        replaceNestedSources(layer, compNameMap, renameOptions);
      }
    }
  }

  return duplicatedFolder;
}

function duplicateSelectedComps(selectedComps, renameOptions, compNameMap) {
  if (!compNameMap) {
    compNameMap = {};
  }

  for (var i = 0; i < selectedComps.length; i++) {
    var comp = selectedComps[i];
    if (comp instanceof CompItem) {
      var duplicatedComp = duplicateCompWithRename(comp, renameOptions);
      compNameMap[comp.name] = duplicatedComp.name;
    }
  }

  for (var compName in compNameMap) {
    var duplicatedComp = findCompByName(compNameMap[compName]);
    if (duplicatedComp) {
      for (var j = 1; j <= duplicatedComp.numLayers; j++) {
        var layer = duplicatedComp.layer(j);
        updatePropertyExpressions(layer, compNameMap);
        replaceNestedSources(layer, compNameMap, renameOptions);
      }
    }
  }
}

function main_sugi(renameOptions) {
  var selectedItems = app.project.selection;
  if (selectedItems.length === 0) {
    alert("No compositions selected. Please select one or more compositions in the project panel.");
    return;
  }

  app.beginUndoGroup("Duplicate and Rename");

  var compNameMap = {}; 

  if (selectedItems[0] instanceof FolderItem) {
    duplicateFolderContents(selectedItems[0], renameOptions, compNameMap);
  } else if (selectedItems[0] instanceof CompItem) {
    duplicateSelectedComps(selectedItems, renameOptions, compNameMap);
  }

  app.endUndoGroup();
}