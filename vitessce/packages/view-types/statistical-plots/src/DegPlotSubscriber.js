import React, { useState, useMemo, useEffect } from 'react';
import {
  TitleInfo,
  useDeckCanvasSize,
  useCoordination,
  useLoaders,
  useReady,
  useUrls,
  useObsSetsData,
  useObsFeatureMatrixData,
} from '@vitessce/vit-s';
import { ViewType, COMPONENT_COORDINATION_TYPES, ViewHelpMapping } from '@vitessce/constants-internal';
import DegPlot from './DegPlot.js';

function DegPlotSubscriber(props) {
  const {
    coordinationScopes,
    theme,
    downloadButtonVisible,
    closeButtonVisible,
    removeGridComponent,
    helpText = ViewHelpMapping.DEG_PLOT,
    tooltipsVisible,
  } = props;

  const loaders = useLoaders();
  const [width, height] = useDeckCanvasSize();
  const [isRendering, setIsRendering] = useState(false);

  // Coordination system에서 필요한 상태와 설정 가져오기
  const [{
    dataset,
    obsType,
    featureType,
    featureSelection: geneSelection, // 사용자가 선택한 유전자(들)
    featureHighlight: geneHighlight,
    obsSetSelection: cellSetSelection, // 사용자가 선택한 세포 그룹
    obsSetColor: cellSetColor,
    additionalObsSets: additionalCellSets, // 사용자 정의 세포 그룹
  }, {
    setObsSetSelection: setCellSetSelection,
    setObsSetColor: setCellSetColor,
  }] = useCoordination(
    COMPONENT_COORDINATION_TYPES[ViewType.DEG_PLOT],
    coordinationScopes,
  );

  // 세포 그룹 데이터 가져오기
  const [{ obsSets: cellSets, obsSetsMembership }, obsSetsStatus, obsSetsUrls] = useObsSetsData(
    loaders, dataset, false,
    { setObsSetSelection: setCellSetSelection, setObsSetColor: setCellSetColor },
    { obsSetSelection: cellSetSelection, obsSetColor: cellSetColor },
    { obsType },
  );

  // 유전자 발현 데이터 가져오기
  const [{ obsIndex, featureIndex, obsFeatureMatrix }, matrixStatus, matrixUrls] = useObsFeatureMatrixData(
    loaders, dataset, true, {}, {},
    { obsType, featureType },
  );

  // 선택한 세포 그룹이 2개가 아니면 빈 배열 반환
  const [cellSet1, cellSet2] = useMemo(() => {
    if (!cellSetSelection || cellSetSelection.length !== 2 || !obsSetsMembership) return [[], []];

    const getCellsFromPath = (pathArray) => {
      const lowerPath = pathArray.map(p => p.trim().toLowerCase()).join('/');

      // 1. from obsSetsMembership (원래 데이터셋으로부터 받은 cellSets)
      const fromOriginalSets = Array.from(obsSetsMembership.entries())
        .filter(([cellId, groups]) => 
            Array.isArray(groups) && 
            groups.flat(2).map(g => g.trim().toLowerCase()).join("/").includes(lowerPath)
        )
        .map(([cellId]) => cellId);

      // 2. from additionalCellSets (사용자가 새롭게 라쏘툴로 정의한 cellSets)
      const fromUserDefinedSets = (() => {
        const traverse = (nodes, currentPath = "") => {
          return nodes.flatMap(node => {
            const fullPath = currentPath ? `${currentPath}/${node.name.trim().toLowerCase()}` : node.name.trim().toLowerCase();
            
            if (fullPath === lowerPath) {
              return node.set ? node.set.map(([cellId]) => cellId) : [];
            }

            return node.children ? traverse(node.children, fullPath) : [];
          });
        };
        return additionalCellSets?.tree ? traverse(additionalCellSets.tree) : [];
      })();
      console.log("Degplot에서의 userdefined: ", additionalCellSets);

      // 3. 1,2의 cellID 합치기 == 선택한 세포 그룹 내 모든 세포 id
      return [...fromOriginalSets, ...fromUserDefinedSets];
    };

    const group1Cells = getCellsFromPath(cellSetSelection[0]);
    const group2Cells = getCellsFromPath(cellSetSelection[1]);

    return [group1Cells, group2Cells];
}, [cellSetSelection, obsSetsMembership, additionalCellSets]);

  // 선택한 세포 그룹의 이름
  let selectedCellGroups = [];
  if (cellSetSelection && cellSetSelection.length == 2) {
    const firstLength = cellSetSelection[0].length;
    const secondLength = cellSetSelection[1].length;
    selectedCellGroups = [cellSetSelection[0][firstLength-1], cellSetSelection[1][secondLength-1]];
  }

  // filtered expression data
  const filteredExpressionData = useMemo(() => {
    if (!obsFeatureMatrix?.data || !obsIndex) return null;

    const genesCount = featureIndex ? featureIndex.length : 0;

    // obsIndex에서 cellSet1, cellSet2의 인덱스를 찾기
    const cellSet1Indices = cellSet1.map(cell => obsIndex.indexOf(cell)).filter(index => index !== -1);
    const cellSet2Indices = cellSet2.map(cell => obsIndex.indexOf(cell)).filter(index => index !== -1);

    const extractExpressionData = (cellIndices) => {
      return cellIndices.map(cellIndex => {
          const start = cellIndex * genesCount;
          const end = start + genesCount;
          return obsFeatureMatrix.data.slice(start, end); // 해당 세포의 유전자 발현량만 추출
      });
    };

    return {
      cellSet1Expressions: extractExpressionData(cellSet1Indices),
      cellSet2Expressions: extractExpressionData(cellSet2Indices),
      featureIndex, // 유전자 리스트
    };
}, [obsFeatureMatrix, obsIndex, featureIndex, cellSet1, cellSet2]);

const isReady = useReady([matrixStatus, obsSetsStatus]);
const urls = useUrls([matrixUrls, obsSetsUrls]);


  // 백엔드(파이썬) 통신
  const [degData, setDegData] = useState([]); // state로 degData 관리
  const [isLoading, setIsLoading] = useState(true);  // 로딩 상태 관리

  async function fetchDEGAnalysis(group1, group2, featureIndex) {
    try {
      const response = await fetch('http://127.0.0.1:5000/deg_analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group1: group1,
          group2: group2,
          featureIndex: featureIndex,
        }),
      });
      const result = await response.json();
      console.log('Response from backend:', result);
      return result;

    } catch (error) {
      console.error('Failed to connect to backend:', error);
    }
  }

  // deg 데이터를 비동기적으로 처리
  async function processDegData() {
    const degResult = await fetchDEGAnalysis(filteredExpressionData.cellSet1Expressions, filteredExpressionData.cellSet2Expressions, featureIndex);

    // 백엔드로부터 받아온 결과를 plotting할 수 있는 형태로 바꾸기
    let degData = Object.keys(degResult).map(gene=> ({
      gene: degResult[gene].gene,
      log2FoldChange: degResult[gene].log2FoldChange,
      pValue: degResult[gene].pValue,
      negLogPValue: degResult[gene].negLogPValue,
      isHighlighted: ((geneSelection || []).includes(degResult[gene].gene) || (geneHighlight || []).includes(degResult[gene].gene))
    }));
    
    setDegData(degData);
    setIsLoading(false);
  }
  useEffect(() => {
    async function fetchData() {
      if (
        filteredExpressionData &&
        filteredExpressionData.cellSet1Expressions.length > 0 &&
        filteredExpressionData.cellSet2Expressions.length > 0
      ) {
        setIsLoading(true); // 로딩 시작
        await processDegData(); // 새로운 데이터 가져오기
      }
    }
    fetchData();
  }, [filteredExpressionData, geneSelection, geneHighlight]);
  // filteredExpressionData, geneSelection, geneHighlight가 변경될 때마다 업데이트 

  if(isLoading){
    console.log("deg volcano plot is loading...");
    return (
      <TitleInfo
      title="Volcano Plot (Differential Expression)"
      closeButtonVisible={closeButtonVisible}
      downloadButtonVisible={downloadButtonVisible}
      removeGridComponent={removeGridComponent}
      urls={urls}
      theme={theme}
      isReady={isReady && !isRendering}
      helpText={helpText}
    >
      <DegPlot 
        data={null}  
        theme={theme} 
        width={width} 
        height={height} 
        selectedCellGroups={selectedCellGroups}
      />
    </TitleInfo>
    );
  }

  return (
    <TitleInfo
      title="Volcano Plot (Differential Expression)"
      closeButtonVisible={closeButtonVisible}
      downloadButtonVisible={downloadButtonVisible}
      removeGridComponent={removeGridComponent}
      urls={urls}
      theme={theme}
      isReady={isReady && !isRendering}
      helpText={helpText}
    >
      <DegPlot 
        data={degData.length > 0 ? degData : null} 
        theme={theme} 
        width={width} 
        height={height} 
        selectedCellGroups={selectedCellGroups}
      />
    </TitleInfo>
  );
}

export default DegPlotSubscriber;