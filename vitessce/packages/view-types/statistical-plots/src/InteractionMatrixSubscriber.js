// cell-cell interaction heatmap matrix subscriber
// 필요한 데이터: 세포 위치 데이터(중심점), 세포클러스터 데이터, 세포 색상 데이터

import React, { useState, useMemo, useEffect } from 'react';
import {
    TitleInfo,
    useCoordination,
    useLoaders,
    useReady,
    useUrls,
    useObsSetsData,
    useObsLocationsData,
} from '@vitessce/vit-s';
import InteractionMatrix from './InteractionMatrix.js';
import { ViewType, COMPONENT_COORDINATION_TYPES, ViewHelpMapping } from '@vitessce/constants-internal';

function InteractionMatrixSubscriber(props) {
    const {
        coordinationScopes,
        theme,
        downloadButtonVisible,
        closeButtonVisible,
        removeGridComponent,
        helpText=ViewHelpMapping.INTERACTION_MATRIX,
    } = props;

    const loaders = useLoaders();

    // coordination system에서 필요한 상태, 설정 가져오기
    const [{
        dataset, 
        obsType,
        obsSetSelection: cellSetSelection,
        obsSetColor: cellSetColor,  // 세포 클러스터별 색상
        additionalObsSets: additionalCellSets,
    }, {
        setObsSetSelection: setCellSetSelection,
        setObsSetColor: setCellSetColor,
    }] = useCoordination(
        COMPONENT_COORDINATION_TYPES[ViewType.INTERACTION_MATRIX],
        coordinationScopes,
    );
    // 세포 그룹 데이터 가져오기
    const [{ obsSets: cellSets, obsSetsMembership }, obsSetsStatus, obsSetsUrls] = useObsSetsData(
        loaders, dataset, false,
        { setObsSetSelection: setCellSetSelection, setObsSetColor: setCellSetColor },
        { obsSetSelection: cellSetSelection, obsSetColor: cellSetColor },
        { obsType },
    );

    // 세포 위치(중심점) 데이터 가져오기(segmentation이나 일반 location은 모든 polygon 좌표들이 포함되므로 centroid 좌표로 불러오기)
    const [{
        obsIndex: obsCentroidsIndex,
        obsLocations: obsCentroids,
    }, obsCentroidsStatus, obsCentroidsUrls] = useObsLocationsData(
        loaders, dataset, false, {}, {},
        { obsType }, 
    );

    // 사용자가 선택한 cell clusters안에 속한 cell들의 id 추출
    const selectedCellSetsId = useMemo(() => {
        if (!cellSetSelection || cellSetSelection.length === 0 || !obsSetsMembership) return [];
    
        const getCellsFromPath = (pathArray) => {
            console.log("pathArray: ", pathArray);
            const lowerPath = pathArray.map(p => p.trim().toLowerCase()).join('/');
            console.log("lowerPath: ", lowerPath);
            // 1. from obsSetsMembership (원래 데이터셋으로부터 받은 cellSets)
            const fromOriginalSets = Array.from(obsSetsMembership.entries())
            .filter(([cellId, groups]) => 
                Array.isArray(groups) && 
                groups.flat(2).map(g => g.trim().toLowerCase()).join("/").includes(lowerPath)
            )
            .map(([cellId]) => cellId);

            console.log("fromOriginalSets: ", fromOriginalSets);
        
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
        
            // 3. 1,2의 cellID 합치기 == 선택한 세포 그룹 내 모든 세포 id
            return [...fromOriginalSets, ...fromUserDefinedSets];
        };

        return cellSetSelection.map(item => getCellsFromPath(item));

      }, [cellSetSelection, obsSetsMembership, additionalCellSets]);

    // cell id 기준 그 순으로 이름 나열 (cellSetSelections 의 이름 추출)
    const cellTypeMatrix = selectedCellSetsId.flatMap((cellIds, index)=>
        cellIds.map(cellId => [
            cellId,
            cellSetSelection[index].slice(1).join(' ')
        ])
    );

    // ex. 0: ['2576', 'Selection 1']
    const cellIndex = cellTypeMatrix.map(row=>row[0]);
    const cellType = cellTypeMatrix.map(row=>row[1]);

    // cell 그룹 색상 추출
    function componentToHex(c) {    // 10진수 -> 16진수로 변환 
        const hex = c.toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
    }
    function rgbToHex(color) {   // rgb 색상 -> hex 색상
        return `#${componentToHex(color[0])}${componentToHex(color[1])}${componentToHex(color[2])}`;
    }
    const getColorForSelection = (selection) => {
        return cellSetColor.find(({path})=>
            JSON.stringify(path)===JSON.stringify(selection))?.color || [0,0,0];
    };
    let hexColors = null;
    if (cellSetSelection){
        const selectedColors = cellSetSelection.map(getColorForSelection);
        hexColors = selectedColors.map(rgbToHex);
    }
    
    // spatial 좌표
    // cellIndex 기준으로 찾기
    // cellIndex값 차례로 순회하며, 그 값과 일치하는 게 obsCentroidsIndex에서 몇번째(n)에 위치하고 있는지 확인하고,
    // n번째에 위치한 x,y좌표를 obsCentroids에서 뽑아와서 그것을 새로운 데이터에 저장(cell개수x2 행렬)
    const spatial = cellIndex.map(cellId => {
        const n = obsCentroidsIndex.indexOf(cellId);  
        if ( n !== -1){
            return [obsCentroids?.data[0][n], obsCentroids?.data[1][n]];
        }
        return [null, null];
    });

    // 백엔드 통신
    const [prevInteractData, setPrevInteractData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [interactData, setInteractData] = useState(null);  

    async function fetchInteractionMatrix() {
        try {
            const response = await fetch('http://127.0.0.1:5000/cell_interaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cell_type: cellType ? cellType : null,
                    spatial: spatial ? spatial : null,
                    cell_type_colors: hexColors ? hexColors : null,
                }),
            });
            const result = await response.json();
            console.log('Respond from backend: ', result);
            return result;
        } catch (error) {
            console.error('Failed to connect to backend: ', error);
        }
    }

    async function processInteractData() {
        const newInteractData = await fetchInteractionMatrix();
        setInteractData(newInteractData); 
    }

    async function fetchData() {
        if (new Set(cellType).size !== 1 && spatial && hexColors && cellType.length!==0) {
            console.log("Checking if new data is needed...");
            setIsLoading(true);

           await processInteractData();

            // 이전과 다른 데이터가 들어왔을 때만 새로 업데이트
            if (prevInteractData === null || JSON.stringify(interactData) !== JSON.stringify(prevInteractData)) {
                console.log("New data detected, fetching interaction matrix...");
                setPrevInteractData(interactData);  // 데이터 업데이트
                setIsLoading(false);
            } else {
                setIsLoading(false);
                console.log("No new data, skipping re-fetch.");
            }
        }
    }

    useEffect(() => {
        fetchData();
    }, [cellSetSelection]);  

    const isReady = useReady([obsSetsStatus]);
    const urls = useUrls([obsSetsUrls]);

    if (cellType && interactData && hexColors && new Set(cellType).size >= 2) {
        return (
            <TitleInfo
                title="Cell-Cell Interaction Matrix"
                closeButtonVisible={closeButtonVisible}
                downloadButtonVisible={downloadButtonVisible}
                removeGridComponent={removeGridComponent}
                urls={urls}
                theme={theme}
                isReady={isReady}
                helpText={helpText}
            >
                <InteractionMatrix
                    cellType={cellType}
                    interactData={interactData}
                    hexColors={hexColors}
                    theme={theme}
                />
            </TitleInfo>
        );
    }
    else {
        return (
            <TitleInfo
                title="Cell-Cell Interaction Matrix"
                closeButtonVisible={closeButtonVisible}
                downloadButtonVisible={downloadButtonVisible}
                removeGridComponent={removeGridComponent}
                urls={urls}
                theme={theme}
                isReady={isReady}
                helpText={helpText}
            >
                <InteractionMatrix
                    cellType={null}
                    interactData={null}
                    hexColors={null}
                    theme={theme}
                />
            </TitleInfo>
        );
    }


}
export default InteractionMatrixSubscriber;