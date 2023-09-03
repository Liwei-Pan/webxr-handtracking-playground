import {
    Clock,
    HalfFloatType,
    Vector2,
    WebGLRenderTarget
} from 'three';
import { CopyShader } from '../shaders/CopyShader.js';
import { ShaderPass } from './ShaderPass.js';
import { MaskPass } from './MaskPass.js';
import { ClearMaskPass } from './MaskPass.js';

const size = /* @__PURE__ */ new Vector2();

class EffectComposer {

    constructor( renderer, baseRenderTarget, renderTarget) {

        this.baseRenderTarget = baseRenderTarget;
        this.renderer = renderer;

        this._pixelRatio = renderer.getPixelRatio();

        if ( renderTarget === undefined ) {

            renderer.getSize( size );
            this._width = size.width;
            this._height = size.height;

            renderTarget = new WebGLRenderTarget( this._width * this._pixelRatio, this._height * this._pixelRatio, { type: HalfFloatType } );
            renderTarget.texture.name = 'EffectComposer.rt1';

        } else {

            this._width = renderTarget.width;
            this._height = renderTarget.height;

        }

        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();
        this.renderTarget2.texture.name = 'EffectComposer.rt2';

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        this.renderToScreen = true;

        this.passes = [];

        this.copyPass = new ShaderPass( CopyShader, this.baseRenderTarget );

        this.clock = new Clock();

        this.onSessionStateChange = this.onSessionStateChange.bind( this );
        this.renderer.xr.addEventListener( 'sessionstart', this.onSessionStateChange );
        this.renderer.xr.addEventListener( 'sessionend', this.onSessionStateChange );

    }

    onSessionStateChange() {

        this.renderer.getSize( size );
        this._width = size.width;
        this._height = size.height;

        this._pixelRatio = this.renderer.xr.isPresenting ? 1 : this.renderer.getPixelRatio();

        this.setSize( this._width, this._height );

    }

    swapBuffers() {

        const tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;

    }

    addPass( pass ) {

        this.passes.push( pass );
        pass.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

    }

    insertPass( pass, index ) {

        this.passes.splice( index, 0, pass );
        pass.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

    }

    removePass( pass ) {

        const index = this.passes.indexOf( pass );

        if ( index !== - 1 ) {

            this.passes.splice( index, 1 );

        }

    }

    isLastEnabledPass( passIndex ) {

        for ( let i = passIndex + 1; i < this.passes.length; i ++ ) {

            if ( this.passes[ i ].enabled ) {

                return false;

            }

        }

        return true;

    }

    render( deltaTime ) {

        // deltaTime value is in seconds

        if ( deltaTime === undefined ) {

            deltaTime = this.clock.getDelta();

        }

        const currentRenderTarget = this.renderer.getRenderTarget();
        if (currentRenderTarget && currentRenderTarget.texture) {
            // console.log('currentRenderTarget: ' + currentRenderTarget.texture.name + ' (' + currentRenderTarget.texture.uuid + ')');
        } else {
            // console.log('currentRenderTarget : ' + currentRenderTarget);
        }

        let maskActive = false;

        for ( let i = 0, il = this.passes.length; i < il; i ++ ) {

            const pass = this.passes[ i ];

            if ( pass.enabled === false ) continue;

            pass.renderToScreen = ( this.renderToScreen && this.isLastEnabledPass( i ) );
            // console.log('render to screen: ' + pass.renderToScreen);
            pass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive );

            if ( pass.needsSwap ) {

                if ( maskActive ) {

                    const context = this.renderer.getContext();
                    const stencil = this.renderer.state.buffers.stencil;

                    //context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
                    stencil.setFunc( context.NOTEQUAL, 1, 0xffffffff );

                    this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime );

                    //context.stencilFunc( context.EQUAL, 1, 0xffffffff );
                    stencil.setFunc( context.EQUAL, 1, 0xffffffff );

                }

                this.swapBuffers();

            }

            if ( MaskPass !== undefined ) {

                if ( pass instanceof MaskPass ) {

                    maskActive = true;

                } else if ( pass instanceof ClearMaskPass ) {

                    maskActive = false;

                }

            }

        }

        if (currentRenderTarget) {
            // console.log('Set rendertarget: ' + currentRenderTarget.texture.name + ' (' + currentRenderTarget.texture.uuid + ')');
            this.renderer.setRenderTarget( currentRenderTarget );
        } else {
            // console.log('Set rendertarget: ' + currentRenderTarget);
            this.renderer.setRenderTarget( this.baseRenderTarget );
        }

    }

    reset( renderTarget ) {

        if ( renderTarget === undefined ) {

            this.renderer.getSize( size );
            this._pixelRatio = this.renderer.getPixelRatio();
            this._width = size.width;
            this._height = size.height;

            renderTarget = this.renderTarget1.clone();
            renderTarget.setSize( this._width * this._pixelRatio, this._height * this._pixelRatio );

        }

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

    }

    setSize( width, height ) {

        this._width = width;
        this._height = height;

        const effectiveWidth = this._width * this._pixelRatio;
        const effectiveHeight = this._height * this._pixelRatio;

        this.renderTarget1.setSize( effectiveWidth, effectiveHeight );
        this.renderTarget2.setSize( effectiveWidth, effectiveHeight );

        for ( let i = 0; i < this.passes.length; i ++ ) {

            this.passes[ i ].setSize( effectiveWidth, effectiveHeight );

        }

    }

    setPixelRatio2( pixelRatio ) {

        this._pixelRatio = pixelRatio;
    }

    setPixelRatio( pixelRatio ) {

        this._pixelRatio = pixelRatio;

        this.setSize( this._width, this._height );

    }

    dispose() {

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();

        this.copyPass.dispose();

        this.renderer.xr.removeEventListener( 'sessionstart', this.onSessionStateChange );
        this.renderer.xr.removeEventListener( 'sessionend', this.onSessionStateChange );

    }

}

export { EffectComposer };