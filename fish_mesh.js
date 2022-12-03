const FISH_VERTEX_STRIDE = 48;

class FishMesh {
    /** 
     * Creates a new mesh and loads it into video memory.
     * 
     * @param {WebGLRenderingContext} gl  
     * @param {number} program
     * @param {number[]} vertices
     * @param {number[]} indices
    */
    constructor( gl, program, vertices, indices, material ) {
        this.verts = create_and_load_vertex_buffer( gl, vertices, gl.STATIC_DRAW );
        this.indis = create_and_load_elements_buffer( gl, indices, gl.STATIC_DRAW );

        this.n_verts = vertices.length;
        this.n_indis = indices.length;
        this.program = program;
        this.material = material;

    }

    set_vertex_attributes() {
        set_vertex_attrib_to_buffer( 
            gl, this.program, 
            "coordinates", 
            this.verts, 3, 
            gl.FLOAT, false, FISH_VERTEX_STRIDE, 0 
        );

        set_vertex_attrib_to_buffer( 
            gl, this.program, 
            "color", 
            this.verts, 4, 
            gl.FLOAT, false, FISH_VERTEX_STRIDE, 12
        );

        set_vertex_attrib_to_buffer( 
            gl, this.program,
            "uv",
            this.verts, 2,
            gl.FLOAT, false, FISH_VERTEX_STRIDE, 28
        );
        
        set_vertex_attrib_to_buffer(
            gl, this.program,
            "surf_normal",
            this.verts, 3,
            gl.FLOAT, false, FISH_VERTEX_STRIDE, 36
        ) 
    }

    /**
     * Render the mesh. Does NOT preserve array/index buffer or program bindings! 
     * 
     * @param {WebGLRenderingContext} gl 
     */
    render( gl ) {
        //gl.cullFace( gl.BACK );
        //gl.enable( gl.CULL_FACE );
        
        gl.useProgram( this.program );
        this.set_vertex_attributes();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.verts );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.indis );
        bind_texture_samplers( gl, this.program, "tex_0" );

        gl.activeTexture( gl.TEXTURE0 );
        this.material.bind( gl );

        gl.drawElements( gl.TRIANGLES, this.n_indis, gl.UNSIGNED_SHORT, 0 );
    }

    /**
     * Parse the given text as the body of an obj file.
     * @param {WebGLRenderingContext} gl
     * @param {WebGLProgram} program
     * @param {string} text
     */
    static from_obj_text( gl, program, text, material ) {
        let lines = text.split( /\r?\n/ );

        let verts = [];
        let tex = [];
        let norms = [];
        let indis = [];
        let color = [0, 0, 0, 1];
        

        for( let line of lines ) {
            let trimmed = line.trim();
            let parts = trimmed.split( /(\s+)/ );

            if ( parts === null || parts.length < 2 || parts[0] == '#' || parts[0] === '') { 
                continue; 
            } else if( parts[0] == 'v' ) {
                
                verts.push( parseFloat( parts[2] ) );
                verts.push( parseFloat( parts[4] ) );
                verts.push( parseFloat( parts[6] ) );
                
                // color data
                verts.push( ...color );

                // placeholder texture coords
                verts.push( ...[0, 0] );

                // placeholder normal vec
                verts.push(...[0, 0, 0]);
            } else if( parts[0] == 'vt') {
                tex.push( parseFloat( parts[2] ) );
                tex.push( parseFloat( parts[4] ) );
            } else if( parts[0] == 'vn') {
                norms.push( parseFloat( parts[2] ) );
                norms.push( parseFloat( parts[4] ) );
                norms.push( parseFloat( parts[6] ) );
            } else if( parts[0] == 'f' ) {
                let vert1_index = parseInt( parts[2].split('/')[0] ) - 1;
                let vert2_index = parseInt( parts[4].split('/')[0] ) - 1;
                let vert3_index = parseInt( parts[6].split('/')[0] ) - 1;

                let vert1_tex_index = parseInt( parts[2].split('/')[1] ) - 1;
                let vert2_tex_index = parseInt( parts[4].split('/')[1] ) - 1;
                let vert3_tex_index = parseInt( parts[6].split('/')[1] ) - 1;

                let vert1_norm_index = parseInt( parts[2].split('/')[1] ) - 1;
                let vert2_norm_index = parseInt( parts[4].split('/')[1] ) - 1;
                let vert3_norm_index = parseInt( parts[6].split('/')[1] ) - 1;

                // add the texture coords and norms
                verts[vert1_index * 12 + 7] = tex[vert1_tex_index * 2]
                verts[vert1_index * 12 + 8] = tex[vert1_tex_index * 2 + 1]
                verts[vert1_index * 12 + 9] = norms[vert1_norm_index * 3]
                verts[vert1_index * 12 + 10] = norms[vert1_norm_index * 3 + 1]
                verts[vert1_index * 12 + 11] = norms[vert1_norm_index * 3 + 2]

                verts[vert2_index * 12 + 7] = tex[vert2_tex_index * 2]
                verts[vert2_index * 12 + 8] = tex[vert2_tex_index * 2 + 1]
                verts[vert2_index * 12 + 9] = norms[vert2_norm_index * 3]
                verts[vert2_index * 12 + 10] = norms[vert2_norm_index * 3 + 1]
                verts[vert2_index * 12 + 11] = norms[vert2_norm_index * 3 + 2]

                verts[vert3_index * 12 + 7] = tex[vert3_tex_index * 2]
                verts[vert3_index * 12 + 8] = tex[vert3_tex_index * 2 + 1]
                verts[vert3_index * 12 + 9] = norms[vert2_norm_index * 3]
                verts[vert3_index * 12 + 10] = norms[vert3_norm_index * 3 + 1]
                verts[vert3_index * 12 + 11] = norms[vert3_norm_index * 3 + 2]
                
                indis.push( vert1_index );
                indis.push( vert2_index );
                indis.push( vert3_index );
            }
        }
                
        return new FishMesh( gl, program, verts, indis, material );
    }

    /**
     * Asynchronously load the obj file as a mesh.
     * @param {WebGLRenderingContext} gl
     * @param {string} file_name 
     * @param {WebGLProgram} program
     * @param {function} f the function to call and give mesh to when finished.
     */
    static from_obj_file( gl, file_name, program, f, material ) {
        let request = new XMLHttpRequest();
        
        // the function that will be called when the file is being loaded
        request.onreadystatechange = function() {
            // console.log( request.readyState );

            if( request.readyState != 4 ) { return; }
            if( request.status != 200 ) { 
                throw new Error( 'HTTP error when opening .obj file: ', request.statusText ); 
            }

            // now we know the file exists and is ready
            let loaded_mesh = FishMesh.from_obj_text( gl, program, request.responseText, material );

            console.log( 'loaded ', file_name );
            f( loaded_mesh );
        };

        
        request.open( 'GET', file_name ); // initialize request. 
        request.send();                   // execute request
    }
}