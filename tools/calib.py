"""Machine-speed calibration: a fixed JS workload and a fixed WebGL draw-call workload in the same headless
Chromium the benchmark uses. Timings from different sessions are comparable after dividing by these numbers
(the doc's reference values were recorded alongside a calibration run).
Usage: python3 calib.py  ->  {"js_ms": ..., "gl_ms": ...}"""
import json, statistics as st
from playwright.sync_api import sync_playwright

PAGE = """<canvas id=c width=400 height=225></canvas><script>
window.calib=()=>{
  // JS: allocation-free float math and object property churn, like a game update loop
  const js=[];for(let r=0;r<5;r++){const t=performance.now();let a=0;const o=[];for(let i=0;i<2000;i++)o.push({x:i,y:i*2,z:0});
    for(let k=0;k<400;k++)for(let i=0;i<2000;i++){const p=o[i];p.z=Math.sin(p.x*0.01+k)*p.y;a+=p.z;}js.push(performance.now()-t+(a>1e99?1:0));}
  // GL: 1,000 small draw calls with a uniform change between each, then a pixel read to flush
  const gl=document.getElementById('c').getContext('webgl2');const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,'#version 300 es\\nin vec2 a;uniform vec2 o;void main(){gl_Position=vec4(a*0.02+o,0,1);}'));
  gl.attachShader(p,sh(gl.FRAGMENT_SHADER,'#version 300 es\\nprecision mediump float;out vec4 c;void main(){c=vec4(1);}'));gl.linkProgram(p);gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const u=gl.getUniformLocation(p,'o'),px=new Uint8Array(4),glt=[];
  for(let r=0;r<5;r++){const t=performance.now();for(let i=0;i<1000;i++){gl.uniform2f(u,(i%40)/20-1,Math.floor(i/40)/12-1);gl.drawArrays(gl.TRIANGLES,0,3);}gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);glt.push(performance.now()-t);}
  return [js,glt];};</script>"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(); pg.set_content(PAGE)
    js, gl = pg.evaluate("()=>calib()"); b.close()
print(json.dumps({"js_ms": round(st.median(js[1:]), 1), "gl_ms": round(st.median(gl[1:]), 1)}))
