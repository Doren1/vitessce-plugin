export const codeluppiViaCsv = {
  name: 'Codeluppi et al., Nature Methods 2018',
  description: 'Spatial organization of the somatosensory cortex revealed by osmFISH',
  version: '1.0.15',
  initStrategy: 'auto',
  datasets: [
    {
      uid: 'codeluppi',
      name: 'Codeluppi',
      files: [
        {
          fileType: 'obsSegmentations.json',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.cells.segmentations.json',
        },
        {
          fileType: 'obsLocations.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.cells.csv',
          options: {
            obsIndex: 'cell_id',
            obsLocations: ['X', 'Y'],
          },
          coordinationValues: {
            obsType: 'cell',
          },
        },
        {
          fileType: 'obsEmbedding.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.cells.csv',
          options: {
            obsIndex: 'cell_id',
            obsEmbedding: ['PCA_1', 'PCA_2'],
          },
          coordinationValues: {
            obsType: 'cell',
            embeddingType: 'PCA',
          },
        },
        {
          fileType: 'obsEmbedding.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.cells.csv',
          options: {
            obsIndex: 'cell_id',
            obsEmbedding: ['TSNE_1', 'TSNE_2'],
          },
          coordinationValues: {
            obsType: 'cell',
            embeddingType: 't-SNE',
          },
        },
        {
          fileType: 'obsSets.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.cells.csv',
          options: {
            obsIndex: 'cell_id',
            obsSets: [
              {
                name: 'Cell Type',
                column: ['Cluster', 'Subcluster'],
              },
            ],
          },
          coordinationValues: {
            obsType: 'cell',
          },
        },
        {
          fileType: 'obsLocations.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.molecules.csv',
          options: {
            obsIndex: 'molecule_id',
            obsLocations: ['X', 'Y'],
          },
          coordinationValues: {
            obsType: 'molecule',
          },
        },
        {
          fileType: 'obsLabels.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.molecules.csv',
          options: {
            obsIndex: 'molecule_id',
            obsLabels: 'Gene',
          },
          coordinationValues: {
            obsType: 'molecule',
          },
        },
        {
          fileType: 'obsFeatureMatrix.csv',
          url: 'https://data-1.vitessce.io/0.0.33/main/codeluppi-2018/codeluppi_2018_nature_methods.cells.matrix.csv',
          coordinationValues: {
            obsType: 'cell',
            featureType: 'gene',
            featureValueType: 'expression',
          },
        },
        {
          fileType: 'image.raster.json',
          options: {
            schemaVersion: '0.0.2',
            images: [
              {
                name: 'Image',
                url: 'https://vitessce-data.storage.googleapis.com/0.0.31/master_release/linnarsson/linnarsson.images.zarr',
                type: 'zarr',
                metadata: {
                  dimensions: [
                    {
                      field: 'channel',
                      type: 'nominal',
                      values: [
                        'polyT',
                        'nuclei',
                      ],
                    },
                    {
                      field: 'y',
                      type: 'quantitative',
                      values: null,
                    },
                    {
                      field: 'x',
                      type: 'quantitative',
                      values: null,
                    },
                  ],
                  isPyramid: true,
                  transform: {
                    translate: {
                      y: 0,
                      x: 0,
                    },
                    scale: 1,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  ],
  coordinationSpace: {
    embeddingZoom: {
      TSNE: 0.75,
    },
    embeddingType: {
      TSNE: 't-SNE',
    },
    spatialZoom: {
      A: -5.5,
    },
    spatialTargetX: {
      A: 16000,
    },
    spatialTargetY: {
      A: 20000,
    },
    spatialSegmentationLayer: {
      A: {
        opacity: 1, radius: 0, visible: true, stroked: false,
      },
    },
    spatialPointLayer: {
      A: {
        opacity: 1, radius: 20, visible: true,
      },
    },
  },
  layout: [
    {
      component: 'degPlot',
      x: 5,
      y: 0,
      w: 4,
      h: 2,
    },
    {
      component: "description",
      props: {
        description: "Codeluppi et al., Nature Methods 2018: Spatial organization of the somatosensory cortex revealed by osmFISH"
      },
      x: 0,
      y: 4,
      w: 2,
      h: 2,
    },
    {
      component: 'interactionMatrix',
      x: 0,
      y: 0,
      w: 5,
      h: 2,
    },
    {
      component: 'spatial',
      
      props: {
        channelNamesVisible: true
      },
      x: 0,
      y: 0,
      w: 5,
      h: 2,
    },  
    {
      component: 'featureList',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
    },
    {
      component: 'obsSets',
      x: 9,
      y: 3,
      w: 3,
      h: 2,
    },
    {
      component: 'obsSetFeatureValueDistribution',
      x: 2,
      y: 4,
      w: 5,
      h: 2,
    },
    {
      component: 'obsSetSizes',
      x: 7,
      y: 4,
      w: 5,
      h: 2,
    },
    {
      component: 'scatterplot',
      coordinationScopes: {
        embeddingType: 'TSNE',
        embeddingZoom: 'TSNE',
      },
      x: 5,
      y: 3,
      w: 4,
      h: 2,
    },
  ],
};
