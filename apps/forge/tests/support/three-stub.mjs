// Test-only stand-in for three.js, used when the real package isn't installed (no WebGL needed).
// minimal THREE stand-in so 3D code paths execute in the offline test browser
(function(){const C=class{constructor(){this.position={set(){}} ;this.scale={set(){}}}};
function M(){return new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:M(),apply:()=>M(),construct:()=>M()});}
window.THREE={WebGLRenderer:class{constructor(){}setPixelRatio(){}setSize(){}render(){window.__rendered=(window.__rendered||0)+1}dispose(){}},
Scene:class{remove(){}add(o){(window.__added=(window.__added||0)+1)}},Color:class{constructor(c){this.c=c}},Fog:class{},
PerspectiveCamera:class{constructor(){this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}}}updateProjectionMatrix(){}lookAt(){}},
BufferGeometry:class{setAttribute(){}dispose(){}},Float32BufferAttribute:class{constructor(a,n){if(a.length%n)throw new Error('bad attr')}},
MeshBasicMaterial:class{dispose(){}},Mesh:class{},CanvasTexture:class{dispose(){}},Sprite:class{constructor(m){this.material=m;this.scale={set(){}};this.position={set(){}}}},
Raycaster:class{setFromCamera(){}intersectObjects(m){return m.length?[{object:m[0],faceIndex:0}]:[]}},Vector2:class{constructor(x,y){this.x=x;this.y=y}set(x,y){this.x=x;this.y=y}},LineLoop:class{constructor(g,m){this.geometry=g;this.material=m}},LineBasicMaterial:class{dispose(){}},
SpriteMaterial:class{constructor(o){this.map=o.map}dispose(){}},NearestFilter:1,NearestMipmapLinearFilter:2,RepeatWrapping:3,DoubleSide:2};})();

const T = window.THREE;
export default T;
export const { WebGLRenderer, Scene, Color, Fog, PerspectiveCamera } = T;
