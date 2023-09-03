import {
	ShaderMaterial,
	UniformsUtils
} from 'three';
import { Pass, FullScreenQuad } from './Pass.js';

class ShaderPass extends Pass {

	constructor( shader, baseRenderTarget, textureID ) {

		super();
		this.baseRenderTarget = baseRenderTarget;

		this.textureID = ( textureID !== undefined ) ? textureID : 'tDiffuse';

		if ( shader instanceof ShaderMaterial ) {

			this.uniforms = shader.uniforms;

			this.material = shader;

		} else if ( shader ) {

			this.uniforms = UniformsUtils.clone( shader.uniforms );

			this.material = new ShaderMaterial( {

				name: ( shader.name !== undefined ) ? shader.name : 'unspecified',
				defines: Object.assign( {}, shader.defines ),
				uniforms: this.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader

			} );

		}

		this.fsQuad = new FullScreenQuad( this.material );

	}

	render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer.texture;

		}

		this.fsQuad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.setRenderTarget( this.baseRenderTarget );
			this.fsQuad.render( renderer );

		} else {

			renderer.setRenderTarget( writeBuffer );
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
			this.fsQuad.render( renderer );

		}
		let renderTarget = renderer.getRenderTarget();
		if (renderTarget && renderTarget.texture) {
			// console.log('Set rendertarget: ' + renderTarget.texture.name + ' (' + renderTarget.texture.uuid + ')');
		} else {
			// console.log('Rendertarget is set to : ' + renderTarget);
		}

	}

	dispose() {

		this.material.dispose();

		this.fsQuad.dispose();

	}

}

export { ShaderPass };