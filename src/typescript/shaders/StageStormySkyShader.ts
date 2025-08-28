export class StageStormySkyShader {
	static readonly vertexShader = `
		attribute vec3 vertex_position;
		attribute vec2 vertex_texCoord0;
		uniform mat4 matrix_model;
		uniform mat4 matrix_view;
		uniform mat4 matrix_projection;
		varying vec2 vUv0;
		void main(){
			vUv0 = vertex_texCoord0;
			gl_Position = matrix_projection * matrix_view * matrix_model * vec4(vertex_position,1.0);
		}
	`;

	static readonly fragmentShader = `
		#ifdef GL_ES
		precision mediump float;
		#endif
		varying vec2 vUv0;
		uniform sampler2D texture_diffuseMap;
		uniform vec2 uScrollSpeed;
		uniform float uTime;
		uniform vec4 uTint;
		void main(){
			vec2 uv = vUv0 + uScrollSpeed * uTime * 0.001;
			vec4 col = texture2D(texture_diffuseMap, uv);
			gl_FragColor = vec4(col.rgb * uTint.rgb, col.a * uTint.a);
		}
	`;
}