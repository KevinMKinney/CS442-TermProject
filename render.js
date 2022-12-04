class RenderMesh {
    constructor( matrix, mesh ) {
        this.matrix = matrix;
        this.mesh = mesh;
    }
}

function generate_render_jobs(parent_matrix, node, jobs) {
    let matrix = parent_matrix.mul(node.getMatrix());

    if (node.data != null) {
        jobs.push( new RenderMesh(matrix, node.data) );
    }

    for (let child of node.children) {
        generate_render_jobs(matrix, child, jobs);
    }
}