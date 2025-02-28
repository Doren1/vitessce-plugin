import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';

export default function InteractionMatrix(props) {
    const {
        cellType,
        interactData,
        hexColors,
        theme,
    } = props;

    if (!cellType || !interactData || !hexColors || hexColors.length===1) {
        return <div>Select more than one cell group.</div>;
    }

    if (interactData.length !== hexColors.length){
        return <div>Loading...</div>
    }

    const uniqueCellTypes = Array.from(new Set(cellType));

    const heatmapDataNivo = uniqueCellTypes.map((cell, rowIndex) => ({
        id: cell,
        data: uniqueCellTypes.map((colCell, colIndex) => ({
            x: colCell,
            y: interactData[colIndex][rowIndex] 
        }))
    }));

    const isDarkTheme = theme === 'dark';
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: clientWidth > 0 ? clientWidth : 600,
                    height: clientHeight > 0 ? clientHeight : 400
                });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            
            {dimensions.width && dimensions.height ? (
                <div style={{ width: dimensions.width, height: dimensions.height }}>
                    <ResponsiveHeatMap
                        data={heatmapDataNivo}
                        margin={{ top: 80, right: 30, bottom: 80, left: 130 }}
                        valueFormat=">-.2s"
                        axisTop={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: -45, 
                            tickColor: isDarkTheme ? '#ffffff' : '#000000',
                            tickValues: uniqueCellTypes, 
                        }}
                        axisRight={null}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 10,
                            tickRotation: 0,
                            tickColor: isDarkTheme ? '#ffffff' : '#000000',
                            tickValues: uniqueCellTypes, 
                        }}
                        theme={{
                            axis: {
                                ticks: {
                                    text: {
                                        fill: isDarkTheme ? '#ffffff' : '#000000', 
                                    },
                                },
                            },
                            labels: {
                                text: {
                                    fill: isDarkTheme ? '#ffffff' : '#000000', 
                                },
                            },
                            legends: {
                                text: {
                                    fill: isDarkTheme ? '#ffffff' : '#000000', 
                                },
                                title: {
                                    text: {
                                        fill: isDarkTheme ? '#ffffff' : '#000000', 
                                    },
                                },
                                ticks: {
                                    text: {
                                        fill: isDarkTheme ? '#ffffff' : '#000000', 
                                    },
                                },
                            },
                        }}
                        colors={{
                            type: 'diverging',
                            scheme: 'yellow_orange_red',
                            divergeAt: 0.5,
                            minValue: Math.min(...interactData.flat()),
                            maxValue: Math.max(...interactData.flat()),
                        }}
                        emptyColor={isDarkTheme ? '#555555' : '#f0f0f0'}
                        cellOpacity={1}
                        cellBorderWidth={1}
                        cellBorderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
                        labelTextColor={{
                            from: 'color',
                            modifiers: [['darker', 1.8]],
                            color: isDarkTheme ? '#ffffff' : '#000000',
                        }}
                        legends={[
                            {
                                anchor: 'bottom',
                                translateX: 0,
                                translateY: 30,
                                length: 400,
                                thickness: 8,
                                direction: 'row',
                                tickPosition: 'after',
                                tickSize: 3,
                                tickSpacing: 4,
                                tickOverlap: false,
                                tickFormat: '>-.2s',
                                title: 'Interaction Strength →',
                                titleAlign: 'start',
                                titleOffset: 4,
                                textColor: isDarkTheme ? '#ffffff' : '#000000',
                                tickColor: isDarkTheme ? '#ffffff' : '#000000',
                            }
                        ]}
                    />
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
}
