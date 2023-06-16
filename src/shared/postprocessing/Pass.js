import {
    BufferGeometry,
    Float32BufferAttribute,
    OrthographicCamera,
    Mesh
} from 'three';

class Pass {

    constructor() {

        this.isPass = true;

        // if set to true, the pass is processed by the composer
        this.enabled = true;

        // if set to true, the pass indicates to swap read and write buffer after rendering
        this.needsSwap = true;

        // if set to true, the pass clears its buffer before rendering
        this.clear = false;

        // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
        this.renderToScreen = false;

    }

    setSize( /* width, height */ ) {}

    render( /* renderer, writeBuffer, readBuffer, deltaTime, maskActive */ ) {

        console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

    }

    dispose() {}

}

// Helper for passes that need to fill the viewport with a single quad.

const _camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

// https://github.com/mrdoob/three.js/pull/21358

const _geometry = new BufferGeometry();
_geometry.setAttribute( 'position', new Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
_geometry.setAttribute( 'uv', new Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

class FullScreenQuad {

    constructor( material, camera4 ) {

        this._mesh = new Mesh( _geometry, material );
        // this.camera = camera4;

    }

    dispose() {

        this._mesh.geometry.dispose();

    }

    render( renderer, camera2 ) {

        // Disable XR projection for fullscreen effects
        // https://github.com/mrdoob/three.js/pull/18846
        const xrEnabled = renderer.xr.enabled;

        renderer.xr.enabled = false;
        renderer.render( this._mesh, _camera );
        // renderer.render( this._mesh, this.camera );
        // renderer.render( this._mesh, camera2 );
        renderer.xr.enabled = xrEnabled;

    }

    get material() {

        return this._mesh.material;

    }

    set material( value ) {

        this._mesh.material = value;

    }

}

export { Pass, FullScreenQuad };
