import React, {useRef, useState, useEffect} from 'react';
import {VegaPlot} from '@vitessce/vega';

export default function DegPlot(props) {
  const {
    data,
    theme,
    width,
    height, 
    selectedCellGroups,
  } = props;

  if (!selectedCellGroups || selectedCellGroups.length !== 2) {
    return <span>Select two cell groups.</span>
  }
  const [group1, group2] = selectedCellGroups;
  
  if (!data) return <div>Select two cell groups.</div>;;

  // x-axis, y-axis범위
  const xValues = data.map(d=>d.log2FoldChange);
  const yValues = data.map(d=>d.negLogPValue);

  const xMin = Math.min(...xValues) - 0.5;
  const xMax = Math.max(...xValues) + 0.5;
  const yMin = Math.min(...yValues) - 0.5;
  const yMax = Math.max(...yValues) + 0.5;

  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const [plotSize, setPlotSize] = useState({width:width, height:height}); 
  
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && legendRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const legendHeight = legendRef.current.clientHeight;

        setPlotSize({
          width: containerWidth - 60, 
          height: containerHeight - legendHeight - 50, 
        });
      }
    };

    updateSize(); // 초기 크기 설정
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // threshold
  const xThreshold1 = -1;
  const xThreshold2 = 1;
  const yThreshold = -Math.log10(0.05);
  
  // 기준선 색상, 텍스트 색상
  const dotLineColor = theme === 'dark' ? 'white' : 'black';
  const textColor = theme === 'dark' ? 'white' : 'black';

  const spec = {
    layer: [
      // data points 
      {
        mark: {
          type: 'point',
          filled: true
        },
        encoding: {
          x: {
            field: 'log2FoldChange',
            type: 'quantitative',
            title: 'Log2 Fold Change',
            axis: {titleColor: textColor, labelColor:textColor},
            scale: { domain: [xMin, xMax] }
          },
          y: {
            field: 'negLogPValue',
            type: 'quantitative',
            title: '-Log10 p-Value',
            axis: {titleColor: textColor, labelColor:textColor},
            scale: { domain: [yMin, yMax] }
          },
          color: {
            condition: [
              {
                test: 'datum.isHighlighted === true',
                value: 'orange', // 사용자가 선택한 유전자를 하이라이트
              },
              {
                test: 'datum.pValue < 0.05 && datum.log2FoldChange > 1',
                value: 'red', // upregulated
              },
              {
                test: 'datum.pValue < 0.05 && datum.log2FoldChange < -1',
                value: 'blue', // downregulated
              },
            ],
            value: 'gray'  // 나머지 유전자(차이가 의미없는)
          },
          size: {
            condition: {
              test: 'datum.isHighlighted === true',
              value: 80,  // 하이라이트된 유전자를 더 크게
            },
            value: 40,
          },
          order: {
            condition:{
              test: 'datum.isHighlighted === true',
              value: 1
            },
            value: 0
          },
          tooltip: [
            { field: 'gene', type: 'nominal', title: 'GeneID' },  // 이름으로 타입 구분(nominal)
            { field: 'log2FoldChange', type: 'quantitative', title: 'Log2FC' },
            { field: 'negLogPValue', type: 'quantitative', title: '-Log10pValue' }, 
          ],
        }
      },
      // x = 1 점선(기준선)
      {
        mark: {type:'rule', strokeDash:[5,5], color:dotLineColor},
        encoding: {x:{datum: xThreshold1}}
      },
      // x = -1 점선(기준선)
      {
        mark: {type:'rule', strokeDash:[5,5], color:dotLineColor},
        encoding: {x:{datum: xThreshold2}}
      },
      // y = -log10(0.05) 점선(기준선)
      {
        mark: {type:'rule', strokeDash:[5,5], color:dotLineColor},
        encoding: {y:{datum: yThreshold}}
      },
    ],
    width: plotSize.width,
    height: plotSize.height,
    config: {
      background: theme === 'dark' ? 'black' : 'white', 
      axis: {
        titleColor: textColor,
        labelColor: textColor,
        gridColor: textColor,
        gridOpacity: 0.3, 
      },
      legend: {
        disable: true
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',  
        width: '100%',  
        marginBottom: '2px',
        color: textColor, 
        fontWeight: 'bold',
        fontSize: '12px',
        padding: '2px'
      }}>
        {group1} vs {group2}
      </div>

      <div style={{ width: `${plotSize.width}px`, height: `${plotSize.height}px` }}> 
        <VegaPlot data={data} spec={spec} theme={theme} />
      </div>

      <div ref={legendRef} style={{ 
        position: 'absolute',
        bottom: '0.1px',
        left: '10px',
        backgroundColor: theme === 'dark' ? '#222' : '#fff',
        padding: '3px',
        borderRadius: '5px',
        boxShadow: theme === 'dark' ? '0px 0px 10px rgba(255, 255, 255, 0.2)' : '0px 0px 10px rgba(0, 0, 0, 0.1)',
        color: textColor, 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{
            width: '10px', height: '10px', backgroundColor: 'red', borderRadius: '50%', marginRight: '5px'
          }}></div>
          <span style={{ fontSize: '10px' }}>Upregulated</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '10px', height: '10px', backgroundColor: 'blue', borderRadius: '50%', marginRight: '5px'
          }}></div>
          <span style={{ fontSize: '10px' }}>Downregulated</span>
        </div>
      </div>
    </div>
);
} 