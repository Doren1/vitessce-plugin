/* eslint-disable no-underscore-dangle */
import React, { useState, useMemo } from 'react';
import { isEqual } from 'lodash-es';
import { nodeToRenderProps, pathToKey } from '@vitessce/sets-utils';
import { getDefaultColor } from '@vitessce/utils';
import Tree from './Tree.js';
import TreeNode from './TreeNode.js';
import { PlusButton, SetOperationButtons } from './SetsManagerButtons.js';
import { useStyles } from './styles.js';

function processNode(node, prevPath, setColor, theme) {
  const nodePath = [...prevPath, node.name];
  return {
    ...node,
    ...(node.children ? ({
      children: node.children
        .map(c => processNode(c, nodePath, setColor)),
    }) : {}),
    color: setColor?.find(d => isEqual(d.path, nodePath))?.color || getDefaultColor(theme),
  };
}

function processSets(sets, setColor, theme) {
  return {
    ...sets,
    tree: sets ? sets.tree.map(lzn => processNode(lzn, [], setColor, theme)) : [],
  };
}

function getAllKeys(node, path = []) {
  if (!node) {
    return null;
  }
  const newPath = [...path, node.name];
  if (node.children) {
    return [pathToKey(newPath), ...node.children.flatMap(v => getAllKeys(v, newPath))];
  }
  return pathToKey(newPath);
}

function processAdditionalSets(additionalSets, setColor, theme, existingSets){
  let index = 0;

  if (additionalSets){
    index = additionalSets.tree?.[0]?.children?.length ?? 0;
  }

  return {
    ...additionalSets,
    tree: additionalSets ? additionalSets.tree.map(lzn=>
      processAdditionalNode(lzn, [], setColor, theme, existingSets, index)) : [],
  };
}

function processAdditionalNode(node, path, setColor, theme, existingSets, index) {
  // 현재 노드만 finIntersections으로 전달
  const intersections = findIntersections(node.children?.[index-1], existingSets.tree);
  const targetChild = node.children?.[index - 1]; // index-1 번째 노드 찾기

  if (targetChild) {
    targetChild.children = [...(targetChild.children || []), ...intersections];
  }

  return {
    ...node,
    children: [...(node.children || [])],
  };
}

function findGroupSet(existingGroup) {
  let sets = [];

  if (existingGroup.set) {
    sets.push(existingGroup.set);
  }

  if (existingGroup.children) {
    existingGroup.children.forEach(childGroup => {
      sets = sets.concat(findGroupSet(childGroup));
    });
  }

  return sets;
}

// 재귀적으로 기존 세포 그룹 탐색하여 교집합 찾기
function findIntersections(node, existingGroups) {
  let results = [];

  if (node && node.set) {
    existingGroups.forEach(existingGroup => {
      if (existingGroup.children) {
        const intersectionResults = []; 

        existingGroup.children.forEach(childGroup => {
          const existingGroupSet = findGroupSet(childGroup);
          const mergedExistingGroupSet = existingGroupSet.flat();

          // 교집합 찾기
          mergedExistingGroupSet.forEach(existingGroupSet => {
            // existingGroupSet에서 첫 번째 값 (cellId)만 사용
            const existingCellId = existingGroupSet[0];
            
            node.set.forEach(([cellId]) => {
              if (existingCellId === cellId) {
                // name과 color가 동일한 항목을 찾아서 set만 추가
                const existingIntersection = intersectionResults.find(
                  result => result.name === `Intersection with ${childGroup.name}` &&
                            result.color === childGroup.color
                );
          
                if (existingIntersection) {
                  // 기존 항목에 set을 추가
                  existingIntersection.set.push([existingCellId, null]);
                } else {
                  // 기존에 없는 항목이라면 새 항목 추가
                  intersectionResults.push({
                    name: `Intersection with ${childGroup.name}`, 
                    set: [[existingCellId, null]],  
                    color: childGroup.color,  
                  });
                }
              }
            });
          });
          
        });

        // 모든 childGroup에 대한 교집합 결과를 하나의 results에 추가
        results = intersectionResults;
      }
    });
  }

  // node에 children이 있으면 재귀적으로 탐색
  if (node && node.children) {
    node.children.forEach(childNode => {
      results = results.concat(findIntersections(childNode, existingGroups));
    });
  }

  return results;
}



/**
 * A generic hierarchical set manager component.
 * @prop {object} tree An object representing set hierarchies.
 * @prop {string} datatype The data type for sets (e.g. "cell")
 * @prop {function} clearPleaseWait A callback to signal that loading is complete.
 * @prop {boolean} draggable Whether tree nodes can be rearranged via drag-and-drop.
 * By default, true.
 * @prop {boolean} checkable Whether to show the "Check" menu button
 * and checkboxes for selecting multiple sets. By default, true.
 * @prop {boolean} editable Whether to show rename, delete, color, or create options.
 * By default, true.
 * @prop {boolean} expandable Whether to allow hierarchies to be expanded
 * to show the list or tree of sets contained. By default, true.
 * @prop {boolean} operatable Whether to enable union, intersection,
 * and complement operations on checked sets. By default, true.
 * @prop {boolean} exportable Whether to enable exporting hierarchies and sets to files.
 * By default, true.
 * @prop {boolean} importable Whether to enable importing hierarchies from files.
 * By default, true.
 * @prop {function} onError Function to call with error messages (failed import validation, etc).
 * @prop {function} onCheckNode Function to call when a single node has been checked or un-checked.
 * @prop {function} onExpandNode Function to call when a node has been expanded.
 * @prop {function} onDropNode Function to call when a node has been dragged-and-dropped.
 * @prop {function} onCheckLevel Function to call when an entire hierarchy level has been selected,
 * via the "Color by cluster" and "Color by subcluster" buttons below collapsed level zero nodes.
 * @prop {function} onNodeSetColor Function to call when a new node color has been selected.
 * @prop {function} onNodeSetName Function to call when a node has been renamed.
 * @prop {function} onNodeRemove Function to call when the user clicks the "Delete" menu button
 * to remove a node.
 * @prop {function} onNodeView Function to call when the user wants to view the set associated
 * with a particular node.
 * @prop {function} onImportTree Function to call when a tree has been imported
 * using the "plus" button.
 * @prop {function} onCreateLevelZeroNode Function to call when a user clicks the "Create hierarchy"
 * menu option using the "plus" button.
 * @prop {function} onExportLevelZeroNode Function to call when a user wants to
 * export an entire hierarchy via the "Export hierarchy" menu button for a
 * particular level zero node.
 * @prop {function} onExportSet Function to call when a user wants to export a set associated with
 * a particular node via the "Export set" menu button.
 * @prop {function} onUnion Function to call when a user wants to create a new set from the union
 * of the sets associated with the currently-checked nodes.
 * @prop {function} onIntersection Function to call when a user wants to create a new set from the
 * intersection of the sets associated with the currently-checked nodes.
 * @prop {function} onComplement Function to call when a user wants to create a new set from the
 * complement of the (union of the) sets associated with the currently-checked nodes.
 * @prop {function} onView Function to call when a user wants to view the sets
 * associated with the currently-checked nodes.
 * @prop {string} theme "light" or "dark" for the vitessce theme
 */
export default function SetsManager(props) {
  const {
    theme,
    sets,
    additionalSets,
    setColor,
    levelSelection: checkedLevel,
    setSelection,
    setExpansion,
    hasColorEncoding,
    datatype,
    draggable = true,
    checkable = true,
    editable = true,
    expandable = true,
    operatable = true,
    exportable = true,
    importable = true,
    onError,
    onCheckNode,
    onExpandNode,
    onDropNode,
    onCheckLevel,
    onNodeSetColor,
    onNodeSetName,
    onNodeCheckNewName,
    onNodeRemove,
    onNodeView,
    onImportTree,
    onCreateLevelZeroNode,
    onExportLevelZeroNodeJSON,
    onExportLevelZeroNodeTabular,
    onExportSetJSON,
    onUnion,
    onIntersection,
    onComplement,
    hasCheckedSetsToUnion,
    hasCheckedSetsToIntersect,
    hasCheckedSetsToComplement,
  } = props;

  const isChecking = true;
  const autoExpandParent = true;
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingNodeName, setIsEditingNodeName] = useState(null);

  const processedSets = useMemo(() => processSets(
    sets, setColor, theme,
  ), [sets, setColor, theme]);

  const processedAdditionalSets = useMemo(()=>processAdditionalSets(
    additionalSets, setColor, theme, processedSets,
  ), [additionalSets, setColor, theme, processedSets]);

  // 경로 배열을 추적하는 함수
  function findPaths(node, path = [], colors=[]) {
    let result = [];

    const currentPath = [...path, node.name];

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        result = result.concat(findPaths(child, currentPath, colors));
      });
    } else {
      result.push({ path: currentPath, colors: node.color });
    }

    return result;
  }

  // "My Selections"부터 시작해서 모든 경로 찾기
  let pathsAndColors =[];
  if (additionalSets){
    additionalSets.tree.forEach(rootNode => {
      pathsAndColors = pathsAndColors.concat(findPaths(rootNode, [], []));
  });
  }

  // setColors에 추가
  pathsAndColors.forEach(item => {
    setColor.push({ path: item.path, color: item.colors });
  });  

  const additionalSetKeys = (processedAdditionalSets
    ? processedAdditionalSets.tree.flatMap(v => getAllKeys(v, []))
    : []
  );

  const allSetSelectionKeys = (setSelection || []).map(pathToKey);
  const allSetExpansionKeys = (setExpansion || []).map(pathToKey);

  const setSelectionKeys = allSetSelectionKeys.filter(k => !additionalSetKeys.includes(k));
  const setExpansionKeys = allSetExpansionKeys.filter(k => !additionalSetKeys.includes(k));

  const additionalSetSelectionKeys = allSetSelectionKeys.filter(k => additionalSetKeys.includes(k));
  const additionalSetExpansionKeys = allSetExpansionKeys.filter(k => additionalSetKeys.includes(k));

  /**
   * Recursively render TreeNode components.
   * @param {object[]} nodes An array of node objects.
   * @returns {TreeNode[]|null} Array of TreeNode components or null.
   */
  function renderTreeNodes(nodes, readOnly, currPath) {
    if (!nodes) {
      return null;
    }
    return nodes.map((node) => {
      const newPath = [...currPath, node.name];
      return (
        <TreeNode
          theme={theme}
          key={pathToKey(newPath)}
          {...nodeToRenderProps(node, newPath, setColor)}

          isEditing={isEqual(isEditingNodeName, newPath)}

          datatype={datatype}
          draggable={draggable && !readOnly}
          // editable={editable && !readOnly} (변경 전)
          editable={editable} // 변경 후
          checkable={checkable}
          expandable={expandable}
          exportable={exportable}

          hasColorEncoding={hasColorEncoding}
          isChecking={isChecking}
          checkedLevelPath={checkedLevel ? checkedLevel.levelZeroPath : null}
          checkedLevelIndex={checkedLevel ? checkedLevel.levelIndex : null}

          onCheckNode={onCheckNode}
          onCheckLevel={onCheckLevel}
          onNodeView={onNodeView}
          onNodeSetColor={onNodeSetColor}
          onNodeSetName={(targetPath, name) => {
            onNodeSetName(targetPath, name);
            setIsEditingNodeName(null);
          }}
          onNodeCheckNewName={onNodeCheckNewName}
          onNodeSetIsEditing={setIsEditingNodeName}
          onNodeRemove={onNodeRemove}
          onExportLevelZeroNodeJSON={onExportLevelZeroNodeJSON}
          onExportLevelZeroNodeTabular={onExportLevelZeroNodeTabular}
          onExportSetJSON={onExportSetJSON}

          disableTooltip={isDragging}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          {renderTreeNodes(node.children, readOnly, newPath, theme)}
        </TreeNode>
      );
    });
  }

  const classes = useStyles();

  return (
    <div className={classes.setsManager}>
      <div className={classes.setsManagerTree}>
        <Tree
          draggable={false}
          checkable={checkable}

          checkedKeys={setSelectionKeys}
          expandedKeys={setExpansionKeys}
          autoExpandParent={autoExpandParent}

          onCheck={(checkedKeys, info) => onCheckNode(
            info.node.props.nodeKey,
            info.checked,
          )}
          onExpand={(expandedKeys, info) => onExpandNode(
            expandedKeys,
            info.node.props.nodeKey,
            info.expanded,
          )}
        >
          {renderTreeNodes(processedSets.tree, true, [], theme)}
        </Tree>
        <Tree
          draggable /* TODO */
          checkable={checkable}

          checkedKeys={additionalSetSelectionKeys}
          expandedKeys={additionalSetExpansionKeys}
          autoExpandParent={autoExpandParent}

          onCheck={(checkedKeys, info) => onCheckNode(
            info.node.props.nodeKey,
            info.checked,
          )}
          onExpand={(expandedKeys, info) => onExpandNode(
            expandedKeys,
            info.node.props.nodeKey,
            info.expanded,
          )}
          onDrop={(info) => {
            const { eventKey: dropKey } = info.node.props;
            const { eventKey: dragKey } = info.dragNode.props;
            const { dropToGap, dropPosition } = info;
            onDropNode(dropKey, dragKey, dropPosition, dropToGap);
          }}
        >
          {renderTreeNodes(processedAdditionalSets.tree, false, [], theme)}
        </Tree>

        <PlusButton
          datatype={datatype}
          onError={onError}
          onImportTree={onImportTree}
          onCreateLevelZeroNode={onCreateLevelZeroNode}
          importable={importable}
          editable={editable}
        />
      </div>
      {isChecking ? (
        <div className={classes.setOperationButtons}>
          <SetOperationButtons
            onUnion={onUnion}
            onIntersection={onIntersection}
            onComplement={onComplement}
            operatable={operatable}

            hasCheckedSetsToUnion={hasCheckedSetsToUnion}
            hasCheckedSetsToIntersect={hasCheckedSetsToIntersect}
            hasCheckedSetsToComplement={hasCheckedSetsToComplement}
          />
        </div>
      ) : null}
    </div>
  );
}
