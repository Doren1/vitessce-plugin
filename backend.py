from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import scanpy as sc
import squidpy as sq
import anndata as ad

app = Flask(__name__)
CORS(app)

# deg 분석
@app.route('/deg_analysis', methods=['POST'])
def deg_analysis():
    try:
        # vitessce에서 보낸 데이터 받기
        data = request.get_json()
        cellSet1Expressions = np.array([list(cell.values()) for cell in data['group1']], dtype=np.float32)
        cellSet2Expressions = np.array([list(cell.values()) for cell in data['group2']], dtype=np.float32)
        geneList = data['featureIndex']

        # scanpy anndata 객체 생성
        all_expressions = np.vstack([cellSet1Expressions, cellSet2Expressions])
        cell_labels = ["group1"] * len(cellSet1Expressions) + ["group2"] * len(cellSet2Expressions)
        adata = sc.AnnData(all_expressions)
        adata.obs["group"] = cell_labels
        adata.var_names = geneList

        # DEG 분석 실행
        sc.tl.rank_genes_groups(adata, groupby="group", method="wilcoxon")

        SMALLEST_FLOAT = np.finfo(float).tiny 

        # 결과 변환
        deg_results = []
        for i, gene in enumerate(geneList):
            log2FoldChange = float(adata.uns["rank_genes_groups"]["logfoldchanges"]["group1"][i])
            pValue = float(adata.uns["rank_genes_groups"]["pvals"]["group1"][i])
            # p-value가 0이면 가장 작은 부동소수점 값으로 대체(기존에는 0으로 절삭)
            adjustedPValue = pValue if pValue > 0 else SMALLEST_FLOAT
            negLogPValue = -np.log10(adjustedPValue)
            deg_results.append({
                "gene": gene,
                "log2FoldChange": log2FoldChange,
                "pValue": pValue,
                "negLogPValue": negLogPValue
            })
        return jsonify(deg_results)

    except Exception as e:
        return jsonify({"error in deg analysis": str(e)})

# cell-cell interaction 분석
@app.route('/cell_interaction', methods=['POST'])
def cell_interaction():
    try: 
        data = request.get_json()
        cell_type = data['cell_type']
        cell_type_colors = data['cell_type_colors']
        spatial = data['spatial']

        # pandas Series로 변환
        cell_type_series = pd.Series(cell_type)
        cell_type_series = cell_type_series.astype('category')

        obs = pd.DataFrame({
            'cell type': cell_type_series
        })

        uns = {
            'cell type_colors': cell_type_colors
        }

        obsm = {
            'spatial': np.array(spatial)  # (n_obs, 2) 형태
        }

        # anndata 객체 생성
        adata = ad.AnnData(X=np.zeros((len(cell_type), 1)),
                           obs=obs,
                           uns=uns,
                           obsm=obsm)

        sq.gr.spatial_neighbors(adata)
        sq.gr.interaction_matrix(adata, cluster_key="cell type")
        interaction_matrix = adata.uns['cell type_interactions']

        return jsonify(interaction_matrix.tolist())  
    except Exception as e:
        return jsonify({"error in cell-cell interaction": str(e)})
    
if __name__ == '__main__':
    app.run(debug=True)


