// Rim Lighting Shader for HD-2D Character Highlighting
// Vertex Shader
#ifdef VERTEX_SHADER

attribute vec3 vertex_position;
attribute vec2 vertex_texCoord0;
attribute vec3 vertex_normal;

uniform mat4 matrix_model;
uniform mat4 matrix_view;
uniform mat4 matrix_viewProjection;
uniform mat3 matrix_normal;

uniform vec3 uCameraPosition;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying float vTime;

void main() {
    vec4 worldPos = matrix_model * vec4(vertex_position, 1.0);
    vWorldPos = worldPos.xyz;
    
    vUv = vertex_texCoord0;
    vNormal = normalize(matrix_normal * vertex_normal);
    vViewDir = normalize(uCameraPosition - worldPos.xyz);
    vTime = uTime;
    
    gl_Position = matrix_viewProjection * worldPos;
}

#endif

// Fragment Shader
#ifdef FRAGMENT_SHADER

precision mediump float;

uniform sampler2D uTexture;
uniform vec3 uRimColor;
uniform float uRimPower;
uniform float uRimIntensity;
uniform vec3 uKeyLightDir;
uniform vec3 uKeyLightColor;
uniform float uKeyLightIntensity;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

// For special effects
uniform float uSpecialEffectTime;
uniform vec3 uSpecialEffectColor;
uniform float uSpecialEffectIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying float vTime;

// Calculate Fresnel effect for rim lighting
float fresnel(vec3 normal, vec3 viewDir, float power) {
    float dotProduct = 1.0 - max(0.0, dot(normal, viewDir));
    return pow(dotProduct, power);
}

// Enhanced rim lighting calculation
vec3 calculateRimLighting(vec3 normal, vec3 viewDir, vec3 rimColor, float rimPower, float rimIntensity) {
    float rim = fresnel(normal, viewDir, rimPower);
    
    // Add animated pulsing for special moves
    float pulse = sin(vTime * 8.0) * 0.2 + 0.8;
    rim *= pulse;
    
    return rim * rimColor * rimIntensity;
}

// Key lighting calculation (SF3:3S style)
vec3 calculateKeyLighting(vec3 normal, vec3 lightDir, vec3 lightColor, float lightIntensity) {
    float NdotL = max(0.0, dot(normal, normalize(-lightDir)));
    
    // Soften the lighting for hand-drawn sprite look
    NdotL = smoothstep(0.0, 1.0, NdotL);
    
    return lightColor * lightIntensity * NdotL;
}

// Special effect highlight (for super moves, parries, etc.)
vec3 calculateSpecialEffect(vec2 uv, float time, vec3 effectColor, float intensity) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Create animated highlight pattern
    float pattern = sin(uv.x * 10.0 + time * 20.0) * sin(uv.y * 10.0 + time * 15.0);
    pattern = (pattern + 1.0) * 0.5; // Normalize to 0-1
    
    // Add radial gradient from center
    vec2 center = uv - 0.5;
    float radial = 1.0 - length(center) * 2.0;
    radial = max(0.0, radial);
    
    float effect = pattern * radial * intensity;
    return effectColor * effect;
}

void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    if (texColor.a < 0.1) discard;
    
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    
    // Base color
    vec3 color = texColor.rgb;
    
    // Calculate ambient lighting
    vec3 ambient = uAmbientColor * uAmbientIntensity;
    
    // Calculate key lighting (main directional light)
    vec3 keyLight = calculateKeyLighting(normal, uKeyLightDir, uKeyLightColor, uKeyLightIntensity);
    
    // Calculate rim lighting
    vec3 rimLight = calculateRimLighting(normal, viewDir, uRimColor, uRimPower, uRimIntensity);
    
    // Calculate special effects
    vec3 specialEffect = calculateSpecialEffect(vUv, uSpecialEffectTime, uSpecialEffectColor, uSpecialEffectIntensity);
    
    // Combine all lighting
    vec3 lighting = ambient + keyLight;
    color *= lighting;
    
    // Add rim lighting (additive)
    color += rimLight;
    
    // Add special effects (additive with saturation)
    color += specialEffect;
    color = min(color, vec3(2.0)); // Prevent over-saturation
    
    gl_FragColor = vec4(color, texColor.a);
}

#endif