export const xen008 = {
    version: '1.0.15',
    name: 'XEN008-H&EImage (private dataset)',
    description: 'example of ome.tif image',
    public: true,
    initStrategy: 'auto',
    datasets : [
        {
        uid: "A",
        name: "XEN008",
        files: [					       
            {
            fileType: "anndata.zarr",
            url: "http://127.0.0.1:8000/obj_final.zarr/",
            coordinationValues: {
                obsType: "cell",
                featureType: "gene",
                featureValueType: "expression",
                embeddingType: "UMAP"
            },
            options: {
                obsFeatureMatrix: {
                    path: "X"
                },
                obsEmbedding: {
                    path: "obsm/X_umap"
                },
                obsSegmentations: {
                    path: "obsm/X_segmentations"
                },
                obsLocations: {
                    path: "obsm/spatial"
                },
                obsSets: [
                {
                    name: "SCT_snn_res.0.3",
                    path: "obs/SCT_snn_res.0.3"										
                },
                {
                    name: "SCT_snn_res.0.5",
                    path: "obs/SCT_snn_res.0.5"										
                },
                {
                    name: "SCT_snn_res.0.7",
                    path: "obs/SCT_snn_res.0.7"										
                },
                {
                    name: "SCT_snn_res.1",
                    path: "obs/SCT_snn_res.1"										
                }]
            }
            },
            {
                fileType: "image.ome-tiff",
                url: "https://vitessce-s3-bucket.s3.ap-southeast-2.amazonaws.com/pyramid_full.ome.tif"
            }
        ]
        }
    ],
    coordinationSpace: {
        dataset: {
            A: "A"
        },
        embeddingZoom: {
            A: 0.75
        },
        embeddingType: {
            A: "UMAP"
        },
        spatialZoom: {
            A: -5.5
        },
        spatialSegmentationLayer: {
            A: {
            opacity: 1, 
            radius: 0, 
            visible: true, 
            stroked: false
        }
        }
    },
    layout: [
        {
        component: "description",
            x: 0,
            y: 0,
            w: 2,
            h: 1
        },
        {
        component: "layerController",
        coordinationScopes: {
            dataset: "A",
            spatialSegmentationLayer: "A"
        },
            x: 0,
            y: 1,
            w: 2,
            h: 2
        },
        {
        component: "obsSets",
            x: 0,
            y: 4,
            w: 2,
            h: 4
        },
        {
        component: "degPlot",
            x: 2,
            y: 0,
            w: 4,
            h: 4
        },
        {
        component: "featureList",
            x: 9,
            y: 0,
            w: 3,
            h: 4
        },
        {
        component: "interactionMatrix",
        
            x: 2,
            y: 4,
            w: 5,
            h: 3
        },

        {
        component: "scatterplot",
        coordinationScopes: {
            dataset: "A",
            embeddingType:"A"
        },
            x: 6,
            y: 0,
            w: 3,
            h: 4
        }
    ]
      
}