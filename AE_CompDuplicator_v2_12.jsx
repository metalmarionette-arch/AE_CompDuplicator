(function() {
    // メインウィンドウ（パレット）
    var win = (this instanceof Panel) ? this : new Window("palette", "複製・資産収集スクリプト", undefined, {resizeable:true});
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    // ───────────────────────────────
    // ■ オプションパネル（置換文字列・前後追加）
    var optionsPanel = win.add("panel", undefined, "オプション");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "left";

    // 【置換文字列1】
    optionsPanel.add("statictext", undefined, "【置換文字列1】");
    var replace1Group = optionsPanel.add("group");
    replace1Group.add("statictext", undefined, "置換前：");
    var replace1Before = replace1Group.add("edittext", undefined, "");
    replace1Before.characters = 20;
    var replace1AfterGroup = optionsPanel.add("group");
    replace1AfterGroup.add("statictext", undefined, "置換後：");
    var replace1After = replace1AfterGroup.add("edittext", undefined, "");
    replace1After.characters = 20;

    // 【置換文字列2】
    optionsPanel.add("statictext", undefined, "【置換文字列2】");
    var replace2Group = optionsPanel.add("group");
    replace2Group.add("statictext", undefined, "置換前：");
    var replace2Before = replace2Group.add("edittext", undefined, "");
    replace2Before.characters = 20;
    var replace2AfterGroup = optionsPanel.add("group");
    replace2AfterGroup.add("statictext", undefined, "置換後：");
    var replace2After = replace2AfterGroup.add("edittext", undefined, "");
    replace2After.characters = 20;

    // 【前後の文字列追加】
    optionsPanel.add("statictext", undefined, "【前後の文字列追加】");
    var addBeforeGroup = optionsPanel.add("group");
    addBeforeGroup.add("statictext", undefined, "前追加：");
    var addBefore = addBeforeGroup.add("edittext", undefined, "");
    addBefore.characters = 20;
    var addAfterGroup = optionsPanel.add("group");
    addAfterGroup.add("statictext", undefined, "後追加：");
    var addAfter = addAfterGroup.add("edittext", undefined, "");
    addAfter.characters = 20;

    // ───────────────────────────────
    // ■ モード選択と操作設定
    // モード選択：フォルダ選択 vs コンポ選択
    var modeGroup = win.add("group");
    modeGroup.orientation = "row";
    var radioFolder = modeGroup.add("radiobutton", undefined, "フォルダ選択");
    var radioComp   = modeGroup.add("radiobutton", undefined, "コンポ選択");
    radioFolder.value = true;

    // モード選択の注釈を追加（初期状態は「フォルダ選択」の注釈）
    var modeAnnotation = win.add("statictext", undefined, "※サブフォルダを含めて対象とします");

    // 操作選択：複製 vs 移動
    var opGroup = win.add("group");
    opGroup.orientation = "row";
    var radioDuplicate = opGroup.add("radiobutton", undefined, "複製");
    var radioMove = opGroup.add("radiobutton", undefined, "移動");
    radioDuplicate.value = true;
    // 【コンポ選択】時のみ注釈を表示するため、ラジオボタン右側に注釈用テキストを追加
    var annotationText = opGroup.add("statictext", undefined, "※フォルダ作成して複製/移動します");
    annotationText.visible = false;

    // チェックボックス：ラベルを「フッテージも複製/移動する（収集）」に変更
    var footageChk = win.add("checkbox", undefined, "フッテージも複製/移動する（収集）");
    footageChk.value = false;

    // フッテージ差し替えのオン/オフ
    var footageReplaceChk = win.add("checkbox", undefined, "フッテージの差し替え");
    footageReplaceChk.value = true;

    // コンポ差し替えのオン/オフ
    var compReplaceChk = win.add("checkbox", undefined, "コンポ内コンポも差し替え");
    compReplaceChk.value = true;

    // ───────────────────────────────
    // ■ UI更新処理（グレーアウト制御とモード注釈の更新）
    function updateUI() {
        if (radioFolder.value) {
            // フォルダ選択の場合
            radioMove.enabled = false;
            radioDuplicate.value = true;
            footageChk.enabled = true;
            footageReplaceChk.enabled = true;
            compReplaceChk.enabled = true;
            // 置換・前後追加は有効
            replace1Before.enabled = true;
            replace1After.enabled  = true;
            replace2Before.enabled = true;
            replace2After.enabled  = true;
            addBefore.enabled      = true;
            addAfter.enabled       = true;
            // コンポ選択専用の注釈は非表示
            annotationText.visible = false;
            // モード注釈更新
            modeAnnotation.text = "※サブフォルダを含めて対象とします";
        } else {
            // コンポ選択の場合
            radioMove.enabled = true;
            footageChk.enabled = true;
            var replaceOptionsEnabled = !radioMove.value;
            footageReplaceChk.enabled = replaceOptionsEnabled;
            compReplaceChk.enabled = replaceOptionsEnabled;
            if (radioMove.value) {
                // 【移動】の場合は置換オプションは不要なのでグレーアウト
                replace1Before.enabled = false;
                replace1After.enabled  = false;
                replace2Before.enabled = false;
                replace2After.enabled  = false;
                addBefore.enabled      = false;
                addAfter.enabled       = false;
            } else {
                // 【複製】の場合は有効
                replace1Before.enabled = true;
                replace1After.enabled  = true;
                replace2Before.enabled = true;
                replace2After.enabled  = true;
                addBefore.enabled      = true;
                addAfter.enabled       = true;
            }
            // コンポ選択専用の注釈は表示
            annotationText.visible = true;
            // モード注釈更新
            modeAnnotation.text = "※選択コンポに関わる全てをサーチして対象とします";
        }
    }
    radioFolder.onClick = updateUI;
    radioComp.onClick   = updateUI;
    radioDuplicate.onClick = updateUI;
    radioMove.onClick      = updateUI;
    updateUI();

    // ───────────────────────────────
    // ■ 実行ボタン
    var execBtn = win.add("button", undefined, "実行");
    execBtn.onClick = function(){
        // UIから常に renameOptions を取得
        var renameOptions = {
            replace: [
                { from: replace1Before.text, to: replace1After.text },
                { from: replace2Before.text, to: replace2After.text }
            ],
            add: { before: addBefore.text, after: addAfter.text },
            replaceFootage: footageReplaceChk.value,
            replaceComps: compReplaceChk.value
        };

        if (radioFolder.value) {
            // フォルダ複製モードの場合
            var dupFootage = footageChk.value;
            duplicateFolderStructureAndUpdateExpressions(dupFootage, renameOptions);
        } else {
            // コンポ選択モードの場合
            var collectMode = radioMove.value ? "move" : "duplicate";
            collectCompAssets(collectMode, renameOptions);
        }
    };

    if (win instanceof Window){
        win.center();
        win.show();
    }

    // ───────────────────────────────
    // ■ 以下、元の処理（フォルダ複製、コンポ資産収集等）のコードはそのまま
    function duplicateFolderStructureAndUpdateExpressions(dupFootage, renameOptions) {
        var proj = app.project;
        if (!proj) {
            alert("プロジェクトが開かれていません。");
            return;
        }
        var selItems = proj.selection;
        if (selItems.length === 0) {
            alert("複製するフォルダを選択してください。");
            return;
        }
        for (var i = 0; i < selItems.length; i++){
            if (!(selItems[i] instanceof FolderItem)) {
                alert("選択項目はフォルダのみ選択してください。");
                return;
            }
        }
        app.beginUndoGroup("フォルダ構造複製・リネーム・参照更新");
        var mapping = [];
        for (var i = 0; i < selItems.length; i++){
            duplicateFolderRecursive(selItems[i], selItems[i].parentFolder, dupFootage, renameOptions, mapping);
        }
        if (renameOptions.replaceComps !== false) {
            for (var i = 0; i < mapping.length; i++){
                if (mapping[i].duplicate instanceof CompItem) {
                    var dupComp = mapping[i].duplicate;
                    for (var j = 1; j <= dupComp.numLayers; j++){
                        var layer = dupComp.layer(j);
                        if (layer.source) {
                            for (var k = 0; k < mapping.length; k++){
                                if (layer.source === mapping[k].original) {
                                    layer.replaceSource(mapping[k].duplicate, false);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        for (var i = 0; i < mapping.length; i++){
            if (mapping[i].duplicate instanceof CompItem) {
                var dupComp = mapping[i].duplicate;
                for (var j = 1; j <= dupComp.numLayers; j++){
                    updateExpressionsInPropertyGroup(dupComp.layer(j), mapping, renameOptions);
                }
                replaceFootageInComp(dupComp, renameOptions);
            }
        }
        
        // エッセンシャルプロパティの更新を追加
        updateEssentialProperties(mapping);
        
        app.endUndoGroup();
        alert("フォルダ複製が完了しました。");
    }

    function duplicateFolderRecursive(originalFolder, parentForDuplicate, dupFootage, renameOptions, mapping) {
        var proj = app.project;
        var newFolderName = originalFolder.name;
        for (var j = 0; j < renameOptions.replace.length; j++) {
            var rep = renameOptions.replace[j];
            newFolderName = newFolderName.replace(new RegExp(rep.from, 'g'), rep.to);
        }
        newFolderName = renameOptions.add.before + newFolderName + renameOptions.add.after;
        if (newFolderName === originalFolder.name) {
            newFolderName = originalFolder.name + "_copy";
        }
        var newFolder = proj.items.addFolder(newFolderName);
        if (parentForDuplicate) {
            newFolder.parentFolder = parentForDuplicate;
        }
        var children = [];
        for (var i = 1; i <= proj.numItems; i++){
            var item = proj.item(i);
            if (item.parentFolder === originalFolder) {
                children.push(item);
            }
        }
        for (var i = 0; i < children.length; i++){
            var child = children[i];
            if (child instanceof FolderItem) {
                duplicateFolderRecursive(child, newFolder, dupFootage, renameOptions, mapping);
            } else if (child instanceof CompItem) {
                var dup = duplicateItemWithRename(child, renameOptions);
                if (dup) {
                    dup.parentFolder = newFolder;
                    mapping.push({ original: child, duplicate: dup });
                }
            } else if (child instanceof FootageItem) {
                if (dupFootage) {
                    var dup = duplicateItemWithRename(child, renameOptions);
                    if (dup) {
                        dup.parentFolder = newFolder;
                        mapping.push({ original: child, duplicate: dup });
                    }
                }
            }
        }
        return newFolder;
    }

    function duplicateItemWithRename(item, renameOptions) {
        var dup = duplicateItem(item);
        if (dup) {
            var newName = item.name;
            for (var j = 0; j < renameOptions.replace.length; j++) {
                var rep = renameOptions.replace[j];
                newName = newName.replace(new RegExp(rep.from, 'g'), rep.to);
            }
            newName = renameOptions.add.before + newName + renameOptions.add.after;
            if (newName === item.name) {
                newName = item.name + "_copy";
            }
            dup.name = newName;
        }
        return dup;
    }

    function duplicateItem(item) {
        var proj = app.project;
        var beforeItems = [];
        for (var i = 1; i <= proj.numItems; i++){
            beforeItems.push(proj.item(i));
        }
        if (typeof item.duplicate === "function") {
            try {
                return item.duplicate();
            } catch (e) {}
        }
        var origSel = [];
        for (var i = 1; i <= proj.numItems; i++){
            if (proj.item(i).selected) {
                origSel.push(proj.item(i));
            }
            proj.item(i).selected = false;
        }
        item.selected = true;
        var dupCmdId = app.findMenuCommandId("複製");
        if (dupCmdId === 0) {
            alert("メニューコマンド「複製」が見つかりません。");
            return null;
        }
        app.executeCommand(dupCmdId);
        var newItem = null;
        for (var i = 1; i <= proj.numItems; i++){
            var candidate = proj.item(i);
            var found = false;
            for (var j = 0; j < beforeItems.length; j++){
                if (candidate === beforeItems[j]){
                    found = true;
                    break;
                }
            }
            if (!found) {
                newItem = candidate;
                break;
            }
        }
        for (var i = 1; i <= proj.numItems; i++){
            proj.item(i).selected = false;
        }
        for (var i = 0; i < origSel.length; i++){
            origSel[i].selected = true;
        }
        return newItem;
    }

    function buildRenamedName(originalName, renameOptions) {
        var newName = originalName;
        for (var j = 0; j < renameOptions.replace.length; j++) {
            var rep = renameOptions.replace[j];
            if (rep.from !== "") {
                newName = newName.replace(new RegExp(rep.from, 'g'), rep.to);
            }
        }
        newName = renameOptions.add.before + newName + renameOptions.add.after;
        return newName;
    }

    function findFootageByName(name) {
        var proj = app.project;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            if (item instanceof FootageItem && item.name === name) {
                return item;
            }
        }
        return null;
    }

    function replaceFootageInComp(comp, renameOptions) {
        if (!renameOptions.replaceFootage) {
            return;
        }

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.source && layer.source instanceof FootageItem) {
                var targetName = buildRenamedName(layer.source.name, renameOptions);
                if (targetName !== layer.source.name) {
                    var targetItem = findFootageByName(targetName);
                    if (targetItem && targetItem.id !== layer.source.id) {
                        layer.replaceSource(targetItem, false);
                    }
                }
            }
        }
    }

    function updateExpressionsInPropertyGroup(propGroup, mapping, renameOptions) {
        if (propGroup.numProperties !== undefined) {
            for (var i = 1; i <= propGroup.numProperties; i++){
                var prop = propGroup.property(i);
                if (prop.canSetExpression && prop.expression !== "") {
                    var expr = prop.expression;
                    if (!renameOptions || renameOptions.replaceComps !== false) {
                        expr = expr.replace(/comp\(["']([^"']+)["']\)/g, function(match, p1) {
                            for (var m = 0; m < mapping.length; m++) {
                                if (mapping[m].original.name === p1) {
                                    return 'comp("' + mapping[m].duplicate.name + '")';
                                }
                            }
                            return match;
                        });
                        expr = expr.replace(/layer\(["']([^"']+)["']\)/g, function(match, p1) {
                            for (var m = 0; m < mapping.length; m++) {
                                if (mapping[m].original.name === p1) {
                                    return 'layer("' + mapping[m].duplicate.name + '")';
                                }
                            }
                            return match;
                        });
                    }
                    expr = expr.replace(/footage\(["']([^"']+)["']\)/g, function(match, p1) {
                        for (var m = 0; m < mapping.length; m++){
                            if (mapping[m].original.name === p1) {
                                return 'footage("' + mapping[m].duplicate.name + '")';
                            }
                        }
                        return match;
                    });
                    if (expr !== prop.expression) {
                        prop.expression = expr;
                    }
                }
                if (prop.numProperties !== undefined && prop.numProperties > 0) {
                    updateExpressionsInPropertyGroup(prop, mapping, renameOptions);
                }
            }
        }
    }

    // ───────────────────────────────
    // ■ エッセンシャルプロパティの更新処理を追加
    function updateEssentialProperties(mapping) {
        try {
            for (var i = 0; i < mapping.length; i++) {
                if (mapping[i].duplicate instanceof CompItem) {
                    var dupComp = mapping[i].duplicate;
                    
                    // コンポジションにエッセンシャルプロパティが存在するかチェック
                    if (dupComp.motionGraphicsTemplate && dupComp.motionGraphicsTemplate.numProperties > 0) {
                        updateEssentialPropertiesInComp(dupComp, mapping);
                    }
                }
            }
        } catch (e) {
            // エッセンシャルプロパティの更新でエラーが発生した場合はスキップ
            // （古いバージョンのAfter Effectsでは motionGraphicsTemplate が使えない場合がある）
        }
    }
    
    function updateEssentialPropertiesInComp(comp, mapping) {
        try {
            var mgt = comp.motionGraphicsTemplate;
            if (!mgt) return;
            
            for (var i = 1; i <= mgt.numProperties; i++) {
                var essentialProp = mgt.property(i);
                if (essentialProp && essentialProp.isEssential) {
                    updateEssentialPropertyReferences(essentialProp, mapping);
                }
            }
        } catch (e) {
            // エラーが発生した場合はスキップ
        }
    }
    
    function updateEssentialPropertyReferences(essentialProp, mapping) {
        try {
            // エッセンシャルプロパティの参照元を確認
            if (essentialProp.property && essentialProp.property.propertyGroup) {
                var propGroup = essentialProp.property.propertyGroup;
                
                // レイヤーまで遡る
                while (propGroup && propGroup.propertyType !== PropertyType.NAMED_GROUP) {
                    if (propGroup.propertyGroup) {
                        propGroup = propGroup.propertyGroup;
                    } else {
                        break;
                    }
                }
                
                // レイヤーのソースがマッピングに含まれているかチェック
                if (propGroup && propGroup.source) {
                    for (var m = 0; m < mapping.length; m++) {
                        if (propGroup.source === mapping[m].original) {
                            // 参照先を複製されたアイテムに更新
                            try {
                                // エッセンシャルプロパティの参照を更新
                                // この部分は After Effects のバージョンによって実装が異なる場合があります
                                essentialProp.property.expression = essentialProp.property.expression.replace(
                                    new RegExp('comp\\("' + mapping[m].original.name + '"\\)', 'g'),
                                    'comp("' + mapping[m].duplicate.name + '")'
                                );
                            } catch (e) {
                                // 更新に失敗した場合はスキップ
                            }
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            // エラーが発生した場合はスキップ
        }
    }

    // ───────────────────────────────
    // ■ コンポ資産収集処理（renameOptions を引数として利用）
    function collectCompAssets(mode, renameOptions) {
        var proj = app.project;
        if (!proj) {
            alert("プロジェクトが開かれていません。");
            return;
        }
        var selItems = proj.selection;
        if (selItems.length === 0) {
            alert("コンポを選択してください。");
            return;
        }
        var selectedComps = [];
        for (var i = 0; i < selItems.length; i++) {
            if (selItems[i] instanceof CompItem) {
                selectedComps.push(selItems[i]);
            }
        }
        if (selectedComps.length === 0) {
            alert("コンポを選択してください。");
            return;
        }
        app.beginUndoGroup("コンポ資産収集");
        var createBaseFolder = !(mode === "duplicate" && !footageChk.value);
        var baseFolder = null;
        if (createBaseFolder) {
            // 変更: 一番上のフォルダ名に "##" を追加する
            var baseFolderName = "##Collected Comps - " + selectedComps[0].name;
            if (selectedComps.length > 1) {
                baseFolderName += " etc.";
            }
            baseFolder = proj.items.addFolder(baseFolderName);
        }
        var nestedComps = [];
        var collectedFootages = [];
        var allowNestedCollection = selectedComps.length > 1;
        function isInArray(item, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === item) {
                    return true;
                }
            }
            return false;
        }
        function collectFromComp(compItem) {
            for (var i = 1; i <= compItem.numLayers; i++) {
                var layer = compItem.layer(i);
                if (layer.source) {
                    if (layer.source instanceof CompItem && allowNestedCollection) {
                        var sourceComp = layer.source;
                        var alreadySelected = false;
                        for (var j = 0; j < selectedComps.length; j++) {
                            if (selectedComps[j] === sourceComp) {
                                alreadySelected = true;
                                break;
                            }
                        }
                        if (!alreadySelected && !isInArray(sourceComp, nestedComps)) {
                            nestedComps.push(sourceComp);
                            collectFromComp(sourceComp);
                        }
                    } else {
                        if (!isInArray(layer.source, collectedFootages)) {
                            collectedFootages.push(layer.source);
                        }
                    }
                }
            }
        }
        for (var i = 0; i < selectedComps.length; i++) {
            collectFromComp(selectedComps[i]);
        }
        function scanExpressionForDependencies(expressionText) {
            var deps = [];
            var compRegex = /comp\(["']([^"']+)["']\)/g;
            var footageRegex = /footage\(["']([^"']+)["']\)/g;
            var match;
            while (match = compRegex.exec(expressionText)) {
                deps.push(match[1]);
            }
            while (match = footageRegex.exec(expressionText)) {
                deps.push(match[1]);
            }
            return deps;
        }
        function scanPropertyGroupForExpressions(prop) {
            if (prop.canSetExpression && prop.expressionEnabled) {
                var expr = prop.expression;
                if (expr && expr.length > 0) {
                    var depNames = scanExpressionForDependencies(expr);
                    for (var k = 0; k < depNames.length; k++) {
                        var depName = depNames[k];
                        for (var i = 1; i <= proj.numItems; i++) {
                            var projItem = proj.item(i);
                            if ((projItem instanceof CompItem || projItem instanceof FootageItem) && projItem.name === depName) {
                                if (projItem instanceof CompItem) {
                                    if (allowNestedCollection && !isInArray(projItem, selectedComps) && !isInArray(projItem, nestedComps)) {
                                        nestedComps.push(projItem);
                                        collectFromComp(projItem);
                                        scanCompForExpressionDependencies(projItem);
                                    }
                                } else if (projItem instanceof FootageItem) {
                                    if (!isInArray(projItem, collectedFootages)) {
                                        collectedFootages.push(projItem);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (prop.numProperties !== undefined) {
                for (var p = 1; p <= prop.numProperties; p++) {
                    scanPropertyGroupForExpressions(prop.property(p));
                }
            }
        }
        function scanLayerForExpressionDependencies(layer) {
            var numProps = layer.numProperties;
            for (var p = 1; p <= numProps; p++) {
                scanPropertyGroupForExpressions(layer.property(p));
            }
        }
        var scannedCompsForExpressions = [];
        function scanCompForExpressionDependencies(compItem) {
            if (isInArray(compItem, scannedCompsForExpressions)) {
                return;
            }
            scannedCompsForExpressions.push(compItem);
            for (var l = 1; l <= compItem.numLayers; l++) {
                var layer = compItem.layer(l);
                scanLayerForExpressionDependencies(layer);
            }
        }
        for (var i = 0; i < selectedComps.length; i++) {
            scanCompForExpressionDependencies(selectedComps[i]);
        }
        var previousLength = 0;
        while (previousLength !== nestedComps.length) {
            previousLength = nestedComps.length;
            for (var i = 0; i < nestedComps.length; i++) {
                if (!isInArray(nestedComps[i], scannedCompsForExpressions)) {
                    scanCompForExpressionDependencies(nestedComps[i]);
                }
            }
        }
        var allItems = [];
        for (var i = 0; i < selectedComps.length; i++) {
            allItems.push(selectedComps[i]);
        }
        for (var i = 0; i < nestedComps.length; i++) {
            allItems.push(nestedComps[i]);
        }
        for (var i = 0; i < collectedFootages.length; i++) {
            allItems.push(collectedFootages[i]);
        }
        function getOriginalFolderChain(item) {
            var chain = [];
            var folder = item.parentFolder;
            while (folder != null && folder.name !== "Root") {
                chain.unshift(folder.name);
                folder = folder.parentFolder;
            }
            // 変更: chainの先頭が "ルート" なら削除する（ベースフォルダをルートとして利用）
            if(chain.length > 0 && chain[0] === "ルート"){
                chain.shift();
            }
            return chain;
        }
        function getOrCreateFolderChain(base, chainArray) {
            var currentFolder = base;
            for (var i = 0; i < chainArray.length; i++) {
                var folderName = chainArray[i];
                var foundFolder = null;
                for (var j = 1; j <= proj.numItems; j++){
                    var item = proj.item(j);
                    if (item instanceof FolderItem && item.name === folderName && item.parentFolder === currentFolder) {
                        foundFolder = item;
                        break;
                    }
                }
                if (!foundFolder) {
                    foundFolder = proj.items.addFolder(folderName);
                    foundFolder.parentFolder = currentFolder;
                }
                currentFolder = foundFolder;
            }
            return currentFolder;
        }
        var mapping = [];
        for (var i = 0; i < allItems.length; i++){
            var item = allItems[i];
            var chain = getOriginalFolderChain(item);
            var targetFolder = item.parentFolder;
            if (createBaseFolder) {
                targetFolder = baseFolder;
                if (chain.length > 0) {
                    targetFolder = getOrCreateFolderChain(baseFolder, chain);
                }
            }
            if (mode === "duplicate") {
                var dup;
                // 【複製】モードの場合、フッテージはチェックがOFFなら何もしない
                if (item instanceof FootageItem && !footageChk.value) {
                    dup = item;
                } else {
                    dup = duplicateItemWithRename(item, renameOptions);
                    dup.parentFolder = targetFolder;
                }
                mapping.push({ original: item, duplicate: dup });
            } else {
                // 【移動】モードの場合
                if (item instanceof FootageItem) {
                    if (footageChk.value) {
                        // チェックONなら移動
                        item.parentFolder = targetFolder;
                    }
                    // チェックOFFなら何もしない（そのまま）
                    mapping.push({ original: item, duplicate: item });
                } else {
                    item.parentFolder = targetFolder;
                    mapping.push({ original: item, duplicate: item });
                }
            }
        }
        if (mode === "duplicate") {
            // 複製時のみ、コンポ内のレイヤー参照およびエクスプレッションの更新を実施
            if (renameOptions.replaceComps !== false) {
                for (var i = 0; i < mapping.length; i++){
                    if (mapping[i].duplicate instanceof CompItem) {
                        var dupComp = mapping[i].duplicate;
                        for (var j = 1; j <= dupComp.numLayers; j++){
                            var layer = dupComp.layer(j);
                            if (layer.source) {
                                for (var k = 0; k < mapping.length; k++){
                                    if (layer.source === mapping[k].original){
                                        layer.replaceSource(mapping[k].duplicate, false);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (var i = 0; i < mapping.length; i++){
                if (mapping[i].duplicate instanceof CompItem) {
                    var dupComp = mapping[i].duplicate;
                    for (var j = 1; j <= dupComp.numLayers; j++){
                        updateExpressionsInPropertyGroup(dupComp.layer(j), mapping, renameOptions);
                    }
                    replaceFootageInComp(dupComp, renameOptions);
                }
            }
            
            // エッセンシャルプロパティの更新を追加
            updateEssentialProperties(mapping);
        }
        app.endUndoGroup();
        alert("コンポ資産収集が完了しました。\n選択コンポ: " + selectedComps.length +
              " 個\nネストコンポ: " + nestedComps.length +
              " 個\nフッテージ: " + collectedFootages.length + " 個");
    }
})();