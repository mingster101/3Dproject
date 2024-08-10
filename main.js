var GL;
  class MyObject{
    canvas = null;
    vertex = [];
    faces = [];

    SHADER_PROGRAM = null;
    _color = null;
    _position = null;

    _MMatrix = LIBS.get_I4();
    _PMatrix = LIBS.get_I4();
    _VMatrix = LIBS.get_I4();
    _greyScality = 0;

    TRIANGLE_VERTEX = null;
    TRIANGLE_FACES = null;

    MODEL_MATRIX = LIBS.get_I4();

    child = [];

    constructor(vertex, faces, source_shader_vertex, source_shader_fragment){
      this.vertex = vertex;
      this.faces = faces;


      var compile_shader = function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
          alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
          return false;
        }
        return shader;
       };
   
    var shader_vertex = compile_shader(source_shader_vertex, GL.VERTEX_SHADER, "VERTEX");
   
    var shader_fragment = compile_shader(source_shader_fragment, GL.FRAGMENT_SHADER, "FRAGMENT");
   
    this.SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(this.SHADER_PROGRAM, shader_vertex);
    GL.attachShader(this.SHADER_PROGRAM, shader_fragment);
   
    GL.linkProgram(this.SHADER_PROGRAM);


    //vao
    this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
    this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");

    //uniform
    this._PMatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"PMatrix"); //projection
    this._VMatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"VMatrix"); //View
    this._MMatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"MMatrix"); //Model
    this._greyScality = GL.getUniformLocation(this.SHADER_PROGRAM, "greyScality");//GreyScality

    GL.enableVertexAttribArray(this._color);
    GL.enableVertexAttribArray(this._position);
    GL.useProgram(this.SHADER_PROGRAM);

    this.TRIANGLE_VERTEX = GL.createBuffer();
    this.TRIANGLE_FACES = GL.createBuffer();
    }

    setup(){
      GL.bindBuffer(GL.ARRAY_BUFFER, this.TRIANGLE_VERTEX);
      GL.bufferData(GL.ARRAY_BUFFER,
      new Float32Array(this.vertex),
      GL.STATIC_DRAW);


      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.TRIANGLE_FACES);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.faces),
      GL.STATIC_DRAW);

      this.child.forEach(object => {
        object.setup
      });
    }


    render(VIEW_MATRIX, PROJECTION_MATRIX){
          GL.useProgram(this.SHADER_PROGRAM);  
          GL.bindBuffer(GL.ARRAY_BUFFER, this.TRIANGLE_VERTEX);
          GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.TRIANGLE_FACES);
          GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4*(3+3), 0);
          GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4*(3+3), 3*4);


          GL.uniformMatrix4fv(this._PMatrix,false,PROJECTION_MATRIX);
          GL.uniformMatrix4fv(this._VMatrix,false,VIEW_MATRIX);
          GL.uniformMatrix4fv(this._MMatrix,false,this.MODEL_MATRIX);
          GL.uniform1f(this._greyScality, 1);
 
          GL.drawElements(GL.TRIANGLES, this.faces.length, GL.UNSIGNED_SHORT, 0);

          GL.flush();

          this.child.forEach(object => {
            object.render(VIEW_MATRIX, PROJECTION_MATRIX);
          });
    }
  }

  function generateBSpline(controlPoint, m, degree) {
    var curves = [];
    var knotVector = [];

    var n = controlPoint.length / 6;


    // Calculate the knot values based on the degree and number of control points
    for (var i = 0; i < n + degree + 1; i++) {
        if (i < degree + 1) {
            knotVector.push(0);
        } else if (i >= n) {
            knotVector.push(n - degree);
        } else {
            knotVector.push(i - degree);
        }
    }



    var basisFunc = function (i, j, t) {
        if (j == 0) {
            if (knotVector[i] <= t && t < (knotVector[(i + 1)])) {
                return 1;
            } else {
                return 0;
            }
        }

        var den1 = knotVector[i + j] - knotVector[i];
        var den2 = knotVector[i + j + 1] - knotVector[i + 1];

        var term1 = 0;
        var term2 = 0;


        if (den1 != 0 && !isNaN(den1)) {
            term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
        }

        if (den2 != 0 && !isNaN(den2)) {
            term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
        }

        return term1 + term2;
    }


    for (var t = 0; t < m; t++) {
        var x = 0;
        var y = 0;
        var z = 0;
        var r = 0;
        var g = 0;
        var b = 0;

        var u = (t / m * (knotVector[controlPoint.length / 6] - knotVector[degree])) + knotVector[degree];

        //C(t)
        for (var key = 0; key < n; key++) {

            var C = basisFunc(key, degree, u);
            x += (controlPoint[key * 6] * C);
            y += (controlPoint[key * 6 + 1] * C);
            z += (controlPoint[key * 6 + 2] * C);
            r += (controlPoint[key * 6 + 3] * C);
            g += (controlPoint[key * 6 + 4] * C);
            b += (controlPoint[key * 6 + 5] * C);
        }
        curves.push(x);
        curves.push(y);
        curves.push(z);
        curves.push(r);
        curves.push(g);
        curves.push(b);

    }
    return curves;
}




function buatKurva3D(pointList, radius) {
    const totalPoints = 100;
    const vertices = [];
    const indices = [];
    const splinePoints = generateBSpline(pointList, totalPoints, (pointList.length / 6) - 1);

    for (let i = 0; i < totalPoints * 2; i++) {
        for (let j = 0; j < 360; j++) {
            const angleInRadians = (j * Math.PI) / 180;
            const newX = splinePoints[i * 6] + Math.cos(angleInRadians) * radius; // Rotate around X-axis
            const newY = splinePoints[i * 6 + 1] + Math.sin(angleInRadians) * radius; // Y-coordinate remains the same
            const newZ = splinePoints[i * 6 + 2]; // Translate along Z-axis
            const r = splinePoints[i * 6 + 3];
            const g = splinePoints[i * 6 + 4];
            const b = splinePoints[i * 6 + 5];
            vertices.push(newX, newY, newZ, r, g, b);
        }
    }

    for (let i = 0; i < totalPoints * 2; i++) {
        for (let j = 0; j < 360; j++) {
            indices.push(j + (i * 360), j + 360 + (i * 360), j + 361 + (i * 360));
            indices.push(j + (i * 360), j + 1 + (i * 360), j + 361 + (i * 360));
        }
    }

    return { vertices, indices };
}
 
 
  function main(){
    var CANVAS = document.getElementById("myCanvas");


    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var drag = false;
    var dX = 0;
    var dY = 0;
    var WorlddX = 0;
    var WorlddY = 0;
    var WorlddZ = 0;

    var WorldPos = [0,0,-20];
    var goombaPos = [0,0,0];
    var goombaMoveSpeed = 0.08;
    var walkFront = false;

    var goombaFeet1Pos = [0,0,0];
    var goombaFeet2Pos = [0,0,0];
    var goombaFeet1RotatePos = 0;
    var rotateBack1 = false;
    var goombaFeet2RotatePos = 0;
    var rotateBack2 = true;
    var goombaRotateSpeed = 0.04;

    var pokioPos = [0,0,0];
    var pokioMoveSpeed = 0.1;
    var walkFrontpokio = true;    
    var pokioFeet1Pos = [0,0,0];
    var pokioFeet2Pos = [0,0,0];
    var pokioFeet1RotatePos = 0;
    var rotateBack1pokio = false;
    var pokioFeet2RotatePos = 0;
    var rotateBack2pokio = true;
    var pokioRotateSpeed = 0.04;

    var booRaise = false;
    var booRaiseSpeed = 0.05;
    var booCounter = 0;

    var booHandRaise = false;
    var booHandRaiseSpeed = 0.05;
    var booHandCounter = 0;

    var leafGrow = true;
    var leafGrow2 = true;
    var leafGrowSpeed = 0.003;
    var leafGrowSpeed2 = 0.0035;
    var leafReverse = 0;
    var leafReverse2 = 0.5;

    var X_prev = 0;
    var Y_prev = 0;

    var THETA = 0;
    var ALPHA = 0;

    var WorldTHETA = 0;
    var WorldALPHA = 0;
    var WorldZ = 0;

    var FRICTION = 0.95;

    var mouseDown = function(e){
      drag = true;
      X_prev = e.pageX;
      Y_prev = e.pageY;
    }

    var mouseUp = function(e){
      drag = false;
    }

    var mouseMove = function(e){
      if(drag) {
        dX = (e.pageX - X_prev)/200;
        dY = (e.pageY - Y_prev)/200;
        X_prev = e.pageX;
        Y_prev = e.pageY;

        THETA += dX*3*Math.PI/CANVAS.width;
        ALPHA += dY*3*Math.PI/CANVAS.height;
        console.log(THETA, ALPHA);
      }
    
    }

    var keyDown = function (e) {
      press=true;
      if(e.key == "w") {
        WorlddZ = 0.15
        WorldZ += WorlddZ*2*Math.PI/CANVAS.height;
      }
      if(e.key == "s") {
        WorlddZ = -0.15
        WorldZ += WorlddZ*2*Math.PI/CANVAS.height;
      }
      if(e.key == "a") {
        WorlddX = 0.15
        WorldTHETA += WorlddX*2*Math.PI/CANVAS.height;
      }
      if(e.key == "d") {
        WorlddX = -0.15
        WorldTHETA += WorlddX*2*Math.PI/CANVAS.height;
      }
      if(e.key == " ") {
        WorlddY = -0.15
        WorldALPHA += WorlddY*2*Math.PI/CANVAS.height;
      }
      if(e.key == "Shift") {
        WorlddY = 0.15
        WorldALPHA += WorlddY*2*Math.PI/CANVAS.height;
      }
      if(e.key == "ArrowUp") {
        dY = 0.15;
        ALPHA += dY*2*Math.PI/CANVAS.height;
      }
      if(e.key == "ArrowDown") {
        dY = -0.15;
        ALPHA += dY*2*Math.PI/CANVAS.height;
      }
      if(e.key == "ArrowLeft") {
        dX = -0.15;
        THETA += dX*2*Math.PI/CANVAS.width;
      }
      if(e.key == "ArrowRight") {
        dX = 0.15;
        THETA += dX*2*Math.PI/CANVAS.width;
      }
      console.log(e.key)

    }

    var keyUp = function (e) {
      press=false;
      WorlddX = 0;
      WorlddY = 0;
      WorlddZ = 0;
    }

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);
    CANVAS.addEventListener("keydown", keyDown, false);
    CANVAS.addEventListener("keyup", keyUp, false);
 
 
     
      try{
          GL = CANVAS.getContext("webgl", {antialias: true});
      }catch(e){
          alert("WebGL context cannot be initialized");
          return false;
      }
      //shaders
      var shader_vertex_source=`
      attribute vec3 position;
      attribute vec3 color;


      uniform mat4 PMatrix;
      uniform mat4 VMatrix;
      uniform mat4 MMatrix;
     
      varying vec3 vColor;
      void main(void) {
      gl_Position = PMatrix*VMatrix*MMatrix*vec4(position, 1.);
      vColor = color;


      gl_PointSize=20.0;
      }`;
      var shader_fragment_source =`
      precision mediump float;
      varying vec3 vColor;
      // uniform vec3 color;


      uniform float greyScality;


      void main(void) {
      float greyScaleValue = (vColor.r + vColor.g + vColor.b)/3.;
      vec3 greyScaleColor = vec3(greyScaleValue, greyScaleValue, greyScaleValue);
      vec3 color = mix(greyScaleColor, vColor, greyScality);
      gl_FragColor = vec4(color, 1.);
      }`;
     
 
 
      /*========================= THE TRIANGLE ========================= */
    POINTS:
    // var triangle_vertex = [
    //   -1, -1, // first corner (ind 0) : -> bottom left of the viewport
    //  1,0,0,
    //   1, -1, // (ind 1) bottom right of the viewport
    //   0,1,0,
    //   0, 1,  // (ind 2) top right of the viewport
    //   0,0,1,
    // ];

    var cube = [
      // belakang
      -1, -1, -1,   0.5, 0.5, 0.5,  // Dark red color for the back face
      1, -1, -1,    0.5, 0.5, 0.5,
      1, 1, -1,     0.5, 0.5, 0.5,
      -1, 1, -1,    0.5, 0.5, 0.5,
  
      // depan
      -1, -1, 1,    0.5, 0.5, 0.5,  // Dark red color for the front face
      1, -1, 1,     0.5, 0.5, 0.5,
      1, 1, 1,      0.5, 0.5, 0.5,
      -1, 1, 1,     0.5, 0.5, 0.5,
  
      // kiri
      -1, -1, -1,   0.5, 0.5, 0.5,  // Dark red color for the left face
      -1, 1, -1,    0.5, 0.5, 0.5,
      -1, 1, 1,     0.5, 0.5, 0.5,
      -1, -1, 1,    0.5, 0.5, 0.5,
  
      // kanan
      1, -1, -1,    0.5, 0.5, 0.5,  // Dark red color for the right face
      1, 1, -1,     0.5, 0.5, 0.5,
      1, 1, 1,      0.5, 0.5, 0.5,
      1, -1, 1,     0.5, 0.5, 0.5,
  
      // bawah
      -1, -1, -1,   0.5, 0, 0,  // Dark red color for the bottom face
      -1, -1, 1,    0.5, 0, 0,
      1, -1, 1,     0.5, 0, 0,
      1, -1, -1,    0.5, 0, 0,
  
      // atas
      -1, 1, -1,    0.5, 0.5, 0.5,  // Dark red color for the top face
      -1, 1, 1,     0.5, 0.5, 0.5,
      1, 1, 1,      0.5, 0.5, 0.5,
      1, 1, -1,     0.5, 0.5, 0.5
  ];
  


var cube_faces = [
        0,1,2,
        0,2,3,

        4,5,6,
        4,6,7,

        8,9,10,
        8,10,11,

        12,13,14,
        12,14,15,

        16,17,18,
        16,18,19,

        20,21,22,
        20,22,23
      ];

      var cube2 = [
        // belakang
        -1, -1, -1,   0.2, 0.2, 0.2,  // Dark grey color for the back face
        1, -1, -1,    0.2, 0.2, 0.2,
        1, 1, -1,     0.2, 0.2, 0.2,
        -1, 1, -1,    0.2, 0.2, 0.2,
    
        // depan
        -1, -1, 1,    0.2, 0.2, 0.2,  // Dark grey color for the front face
        1, -1, 1,     0.2, 0.2, 0.2,
        1, 1, 1,      0.2, 0.2, 0.2,
        -1, 1, 1,     0.2, 0.2, 0.2,
    
        // kiri
        -1, -1, -1,   0.2, 0.2, 0.2,  // Dark grey color for the left face
        -1, 1, -1,    0.2, 0.2, 0.2,
        -1, 1, 1,     0.2, 0.2, 0.2,
        -1, -1, 1,    0.2, 0.2, 0.2,
    
        // kanan
        1, -1, -1,    0.2, 0.2, 0.2,  // Dark grey color for the right face
        1, 1, -1,     0.2, 0.2, 0.2,
        1, 1, 1,      0.2, 0.2, 0.2,
        1, -1, 1,     0.2, 0.2, 0.2,
    
        // bawah
        -1, -1, -1,   0.2, 0.2, 0.2,  // Dark grey color for the bottom face
        -1, -1, 1,    0.2, 0.2, 0.2,
        1, -1, 1,     0.2, 0.2, 0.2,
        1, -1, -1,    0.2, 0.2, 0.2,
    
        // atas
        -1, 1, -1,    0.2, 0.2, 0.2,  // Dark grey color for the top face
        -1, 1, 1,     0.2, 0.2, 0.2,
        1, 1, 1,      0.2, 0.2, 0.2,
        1, 1, -1,     0.2, 0.2, 0.2
    ];
    
    
var cube_faces2 = [
        0,1,2,
        0,2,3,

        4,5,6,
        4,6,7,

        8,9,10,
        8,10,11,

        12,13,14,
        12,14,15,

        16,17,18,
        16,18,19,

        20,21,22,
        20,22,23
      ];
      
      
    var goombaBodyData = LIBS.generateEllipticParaboloid(0,0,0,1,100);
    var goombaFeetData = LIBS.generateEllipsoidX(0,0,0,0.5,100);
    var goombaEyesData = LIBS.generateEllipsoidY(0,0,0,0.35,100);
    var goombaPupilData = LIBS.generateSphere(0,0,0,0.15,100);
    var goombaTeethData = LIBS.generateCone(0,0,0,0.175,0.6,100);

    var pokioBodyData = LIBS.generateEllipsoidPokio(0,0,0,1.5,100);
    var pokioFeetData = LIBS.generateSpherePokio(0,0,0,0.55,100);
    var pokioEyesData = LIBS.generateEllipsoidEyesPokio(0,0,0,0.16,100);
    var pokioBeakData = LIBS.generateConePokio(0,0,0,0.5,2.2,10000);
    var pokioTailData = LIBS.generateConePokio(0,0,0,0.200,1.1,10000);
    var pokioRedData = LIBS.generateEllipsoidRedPokio(0,0,0,0.8,100);
    var pokioNailData = LIBS.generateEllipticParaboloidPokio(0,0,0,0.3,100);
    var pokioHatData = LIBS.generateEllipticParaboloidHatPokio(0,0,0,1.3,100);
    var pokioOuterHatData = LIBS.generateSphereHatPokio(0,0,0,2.4,100);
    var pokioTopHatData = LIBS.generateConeHatPokio(0,0,0,0.20,0.5,10000);
    var pokioWingData = LIBS.generateEllipsoidWingsPokio(0,0,0,0.7,100);
    var pokioOuterWingData = LIBS.generateConeWingPokio(0,0,0,0.200,1.1,10000);

    var BooBodyData = LIBS.generateSphere(0,0,0,1,100);
    var BooEyesData = LIBS.generateEllipsoidY(0,0,0,0.14,100);
    var BooCrownHatData = LIBS.generateEllipticParaboloid(0,0,0,0.45,100);
    var BooTeethData = LIBS.generateCone(0,0,0,0.175,0.34,100);
    var BoohandData = LIBS.generateEllipticParaboloid(0,0,0,0.17,100);
    var BooBrowData = LIBS.generateEllipsoidX(0,0,0,0.17,100);
    var BooTailData = LIBS.generateEllipticParaboloid(0,0,0,0.25,100);
    var BooCrownData = LIBS.generateCone(0,0,0,0.5,1,100);
    var BooTongueData = LIBS.generateEllipsoidZ(0,0,0,0.3,100);
    var BooMouthData = LIBS.generateEllipsoidX(0,0,0,0.40,100);
    var BooPupilData = LIBS.generateEllipsoidY(0,0,0,0.04,100);

    var groundData = LIBS.generateCone(0,0.2,0,20,0.1,10000);
    var logData = LIBS.generateCone(0,0,0,0.5,4,1000);
    var leafData = LIBS.generateCone(0,0,0,1.2,8,1000);

    var castleOuterData = LIBS.generateCone(0,0,0,0.5,3,10000);
    var outerRoadData = LIBS.generateCone(0,0,0,0.175,0.6,100);
    var rootsData = LIBS.generateCone(0,0,0,0.175,0.6,100);
    var rocksData = LIBS.generateSphere(0,0,0,0.55,100);
    
    
    

    for (var i = 0; i < goombaBodyData.vertices.length; i += 6) {
        goombaBodyData.vertices[i + 3] = 153.0/255; // Red component
        goombaBodyData.vertices[i + 4] = 76.0/255; // Green component
        goombaBodyData.vertices[i + 5] = 0.0/255; // Blue component
    }

    for (var i = 0; i < goombaFeetData.vertices.length; i += 6) {
        goombaFeetData.vertices[i + 3] = 51.0/255; // Red component
        goombaFeetData.vertices[i + 4] = 25.0/255; // Green component
        goombaFeetData.vertices[i + 5] = 0.0/255; // Blue component
    }

    for (var i = 0; i < goombaEyesData.vertices.length; i += 6) {
        goombaEyesData.vertices[i + 3] = 255/255; // Red component
        goombaEyesData.vertices[i + 4] = 255/255; // Green component
        goombaEyesData.vertices[i + 5] = 255/255; // Blue component
    }

    for (var i = 0; i < goombaPupilData.vertices.length; i += 6) {
        goombaPupilData.vertices[i + 3] = 0/255; // Red component
        goombaPupilData.vertices[i + 4] = 0/255; // Green component
        goombaPupilData.vertices[i + 5] = 0/255; // Blue component
    }

    for (var i = 0; i < goombaTeethData.vertices.length; i += 6) {
        goombaTeethData.vertices[i + 3] = 255/255; // Red component
        goombaTeethData.vertices[i + 4] = 255/255; // Green component
        goombaTeethData.vertices[i + 5] = 255/255; // Blue component
    }

    for (var i = 0; i < pokioBodyData.vertices.length; i += 6) {
      pokioBodyData.vertices[i + 3] = 0.0/255; // Red component
      pokioBodyData.vertices[i + 4] = 102.0/255; // Green component
      pokioBodyData.vertices[i + 5] = 102.0/255; // Blue component
   }

   for (var i = 0; i < pokioFeetData.vertices.length; i += 6) {
       pokioFeetData.vertices[i + 3] = 255.0/255; // Red component
       pokioFeetData.vertices[i + 4] = 128.0/255; // Green component
       pokioFeetData.vertices[i + 5] = 0.0/255; // Blue component
   }

   for (var i = 0; i < pokioEyesData.vertices.length; i += 6) {
       pokioEyesData.vertices[i + 3] = 255/255; // Red component
       pokioEyesData.vertices[i + 4] = 255/255; // Green component
       pokioEyesData.vertices[i + 5] = 255/255; // Blue component
   }

   for (var i = 0; i < pokioTailData.vertices.length; i += 6) {
     pokioTailData.vertices[i + 3] = 0.0/255; // Red component
     pokioTailData.vertices[i + 4] = 102.0/255; // Green component
     pokioTailData.vertices[i + 5] = 102.0/255; // Blue component
  }

   for (var i = 0; i < pokioBeakData.vertices.length; i += 6) {
       pokioBeakData.vertices[i + 3] = 255/255; // Red component
       pokioBeakData.vertices[i + 4] = 192/255; // Green component
       pokioBeakData.vertices[i + 5] = 17/255; // Blue component
   }

   for (var i = 0; i < pokioRedData.vertices.length; i += 6) {
     pokioRedData.vertices[i + 3] = 255.0/255; // Red component
     pokioRedData.vertices[i + 4] = 51.0/255; // Green component
     pokioRedData.vertices[i + 5] = 51.0/255; // Blue component
  }

  for (var i = 0; i < pokioNailData.vertices.length; i += 6) {
   pokioNailData.vertices[i + 3] = 255.0/255; // Red component
   pokioNailData.vertices[i + 4] = 128.0/255; // Green component
   pokioNailData.vertices[i + 5] = 0.0/255; // Blue component
  }

  for (var i = 0; i < pokioHatData.vertices.length; i += 6) {
   pokioHatData.vertices[i + 3] = 0.0/255; // Red component
   pokioHatData.vertices[i + 4] = 51.0/255; // Green component
   pokioHatData.vertices[i + 5] = 25.0/255; // Blue component
  }

  for (var i = 0; i < pokioOuterHatData.vertices.length; i += 6) {
   pokioOuterHatData.vertices[i + 3] = 0.0/255; // Red component
   pokioOuterHatData.vertices[i + 4] = 51.0/255; // Green component
   pokioOuterHatData.vertices[i + 5] = 25.0/255; // Blue component
  }

  for (var i = 0; i < pokioTopHatData.vertices.length; i += 6) {
   pokioTopHatData.vertices[i + 3] = 243.0/255; // Red component
   pokioTopHatData.vertices[i + 4] = 195.0/255; // Green component
   pokioTopHatData.vertices[i + 5] = 0.0/255; // Blue component
  }

  for (var i = 0; i < pokioWingData.vertices.length; i += 6) {
   pokioWingData.vertices[i + 3] = 255.0/255; // Red component
   pokioWingData.vertices[i + 4] = 204.0/255; // Green component
   pokioWingData.vertices[i + 5] = 255.0/255; // Blue component
  }
 
  for (var i = 0; i < pokioOuterWingData.vertices.length; i += 6) {
   pokioOuterWingData.vertices[i + 3] = 255.0/255; // Red component
   pokioOuterWingData.vertices[i + 4] = 204.0/255; // Green component
   pokioOuterWingData.vertices[i + 5] = 255.0/255; // Blue component
  }

  for (var i = 0; i < BooBodyData.vertices.length; i += 6) {
    BooBodyData.vertices[i + 3] = 211/255; // Red component
    BooBodyData.vertices[i + 4] = 211/255; // Green component
    BooBodyData.vertices[i + 5] = 211/255; // Blue component
}

for (var i = 0; i < BooEyesData.vertices.length; i += 6) {
    BooEyesData.vertices[i + 3] = 0/255; // Red component
    BooEyesData.vertices[i + 4] = 0/255; // Green component
    BooEyesData.vertices[i + 5] = 0/255; // Blue component
}

for (var i = 0; i < BooCrownHatData.vertices.length; i += 6) {
    BooCrownHatData.vertices[i + 3] = 255/255; // Red component
    BooCrownHatData.vertices[i + 4] = 223/255; // Green component
    BooCrownHatData.vertices[i + 5] = 0/255; // Blue component
}

for (var i = 0; i < BooTeethData.vertices.length; i += 6) {
    BooTeethData.vertices[i + 3] = 255/255; // Red component
    BooTeethData.vertices[i + 4] = 255/255; // Green component
    BooTeethData.vertices[i + 5] = 255/255; // Blue component
}

for (var i = 0; i < BoohandData.vertices.length; i += 6) {
    BoohandData.vertices[i + 3] = 192/255; // Red component
    BoohandData.vertices[i + 4] = 192/255; // Green component
    BoohandData.vertices[i + 5] = 192/255; // Blue component
}

for (var i = 0; i < BooBrowData.vertices.length; i += 6) {
  BooBrowData.vertices[i + 3] = 36/255; // Red component
  BooBrowData.vertices[i + 4] = 33/255; // Green component
  BooBrowData.vertices[i + 5] = 36/255; // Blue component
}

  for (var i = 0; i < BooTailData.vertices.length; i += 6) {
    BooTailData.vertices[i + 3] = 192/255; // Red component
    BooTailData.vertices[i + 4] = 192/255; // Green component
    BooTailData.vertices[i + 5] = 192/255; // Blue component

  }

  for (var i = 0; i < BooCrownData.vertices.length; i += 6) {
    BooCrownData.vertices[i + 3] = 255/255; // Red component
    BooCrownData.vertices[i + 4] = 216/255; // Green component
    BooCrownData.vertices[i + 5] = 0/255; // Blue component
  }

  for (var i = 0; i < BooTongueData.vertices.length; i += 6) {
    BooTongueData.vertices[i + 3] = 255/255; // Red component
    BooTongueData.vertices[i + 4] = 0/255; // Green component
    BooTongueData.vertices[i + 5] = 0/255; // Blue component
  }

  for (var i = 0; i < BooMouthData.vertices.length; i += 6) {
    BooMouthData.vertices[i + 3] = 0/255; // Red component
    BooMouthData.vertices[i + 4] = 0/255; // Green component
    BooMouthData.vertices[i + 5] = 0/255; // Blue component
  }

  for (var i = 0; i < BooPupilData.vertices.length; i += 6) {
    BooPupilData.vertices[i + 3] = 255/255; // Red component
    BooPupilData.vertices[i + 4] = 255/255; // Green component
    BooPupilData.vertices[i + 5] = 255/255; // Blue component
  }

  for (var i = 0; i < groundData.vertices.length; i += 6) {
      groundData.vertices[i + 3] = 102/255; // Red component
      groundData.vertices[i + 4] = 51/255; // Green component
      groundData.vertices[i + 5] = 0/255; // Blue component
  }

  for (var i = 0; i < logData.vertices.length; i += 6) {
    logData.vertices[i + 3] = 87/255; // Red component
    logData.vertices[i + 4] = 47/255; // Green component
    logData.vertices[i + 5] = 24/255; // Blue component
  }

  for (var i = 0; i < leafData.vertices.length; i += 6) {
    leafData.vertices[i + 3] = 80/255; // Red component
    leafData.vertices[i + 4] = 0/255; // Green component
    leafData.vertices[i + 5] = 0/255; // Blue component
  }

  for (var i = 0; i < castleOuterData.vertices.length; i += 6) {
    castleOuterData.vertices[i + 3] = 0/255; // Red component
    castleOuterData.vertices[i + 4] = 0/255; // Green component
    castleOuterData.vertices[i + 5] = 0/255; // Blue component
}

  for (var i = 0; i < outerRoadData.vertices.length; i += 6) {
    outerRoadData.vertices[i + 3] = 32/255; // Red component
    outerRoadData.vertices[i + 4] = 32/255; // Green component
    outerRoadData.vertices[i + 5] = 32/255; // Blue component
  }

  for (var i = 0; i < rootsData.vertices.length; i += 6) {
    rootsData.vertices[i + 3] = 51/255; // Red component
    rootsData.vertices[i + 4] = 25/255; // Green component
    rootsData.vertices[i + 5] = 0/255; // Blue component
  }

  for (var i = 0; i < rocksData.vertices.length; i += 6) {
    rocksData.vertices[i + 3] = 192/255; // Red component
    rocksData.vertices[i + 4] = 192/255; // Green component
    rocksData.vertices[i + 5] = 192/255; // Blue component
  }


    var goombaBody = goombaBodyData.vertices;
    var goombaBodyFaces = goombaBodyData.faces;

    var goombaFeet = goombaFeetData.vertices;
    var goombaFeetFaces = goombaFeetData.faces;

    var goombaEyes = goombaEyesData.vertices;
    var goombaEyesFaces = goombaEyesData.faces;

    var goombaPupil = goombaPupilData.vertices;
    var goombaPupilFaces = goombaPupilData.faces;

    var goombaTeeth = goombaTeethData.vertices;
    var goombaTeethFaces = goombaTeethData.faces;

    var pokioBody = pokioBodyData.vertices;
    var pokioBodyFaces = pokioBodyData.faces;

    var pokioFeet = pokioFeetData.vertices;
    var pokioFeetFaces = pokioFeetData.faces;

    var pokioEyes = pokioEyesData.vertices;
    var pokioEyesFaces = pokioEyesData.faces;

    var pokioTail = pokioTailData.vertices;
    var pokioTailFaces = pokioTailData.faces;

    var pokioBeak = pokioBeakData.vertices;
    var pokioBeakFaces = pokioBeakData.faces;

    var pokioRed = pokioRedData.vertices;
    var pokioRedFaces = pokioRedData.faces;

    var pokioNail = pokioNailData.vertices;
    var pokioNailFaces = pokioNailData.faces;

    var pokioHat = pokioHatData.vertices;
    var pokioHatFaces = pokioHatData.faces;

    var pokioOuterHat = pokioOuterHatData.vertices;
    var pokioOuterHatFaces = pokioOuterHatData.faces;
    
    var pokioTopHat = pokioTopHatData.vertices;
    var pokioTopHatFaces = pokioTopHatData.faces;

    var pokioWing = pokioWingData.vertices;
    var pokioWingFaces = pokioWingData.faces;

    var pokioOuterWing = pokioOuterWingData.vertices;
    var pokioOuterWingFaces = pokioOuterWingData.faces;

    var Boobody = BooBodyData.vertices;
    var BooBodyFaces = BooBodyData.faces;

    var BooEyes = BooEyesData.vertices;
    var BooEyesFaces = BooEyesData.faces;

    var BooCrownHat = BooCrownHatData.vertices;
    var BooCrownHatFaces = BooCrownHatData.faces;

    var BooTeeth = BooTeethData.vertices;
    var BooTeethFaces = BooTeethData.faces;

    var BooHand = BoohandData.vertices;
    var BooHandFaces = BoohandData.faces;

    var BooBrow = BooBrowData.vertices;
    var BooBrowFaces = BooBrowData.faces;

    var BooTail = BooTailData.vertices;
    var BooTailFaces = BooTailData.faces;

    var BooCrown = BooCrownData.vertices;
    var BooCrownFaces = BooCrownData.faces;

    var BooTongue = BooTongueData.vertices;
    var BooTongueFaces = BooTongueData.faces;

    var BooMouth = BooMouthData.vertices;
    var BooMouthFaces = BooMouthData.faces;

    var BooPupil = BooPupilData.vertices;
    var BooPupilFaces = BooPupilData.faces;


    var ground = groundData.vertices;
    var groundFaces = groundData.faces;

    var log = logData.vertices;
    var logFaces = logData.faces;

    var leaf = leafData.vertices;
    var leafFaces = leafData.faces;

    var castleBody = cube;
    var castleBodyFaces = cube_faces;

    var castleData = castleOuterData.vertices;
    var castleDataFaces = castleOuterData.faces;

    var roadBody = cube2;
    var roadBodyFaces = cube_faces;

    var outerRoadBody = outerRoadData.vertices;
    var outerRoadFaces = outerRoadData.faces;

    var rootsBody = rootsData.vertices;
    var rootsFaces = rootsData.faces;

    var rocksBody = rocksData.vertices;
    var rocksFaces = rocksData.faces;

    

      //matrix
      var PROJECTION_MATRIX = LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1,100);
      var VIEW_MATRIX = LIBS.get_I4();
      var MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_FEET_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_FEET2_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_EYES_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_EYES2_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_PUPIL_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_PUPIL2_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_TEETH_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_TEETH2_MODEL_MATRIX = LIBS.get_I4();
      var GROUND_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_FEET_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_FEET2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_EYES_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_EYES2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_TAIL_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_BEAK_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_RED_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_RED2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_NAIL_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_NAIL2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_NAIL3_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_NAIL4_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_HAT_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_OUTER_HAT_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_TOP_HAT_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_WING_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_WING2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_OUTER_WING_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_OUTER_WING2_MODEL_MATRIX = LIBS.get_I4();
      var LOG_MODEL_MATRIX = LIBS.get_I4();
      var LEAF_LOWER_MODEL_MATRIX = LIBS.get_I4();
      var LEAF_UPPER_MODEL_MATRIX = LIBS.get_I4();
      var LOG2_MODEL_MATRIX = LIBS.get_I4();
      var LEAF_LOWER2_MODEL_MATRIX = LIBS.get_I4();
      var LEAF_UPPER2_MODEL_MATRIX = LIBS.get_I4();
      var LOG3_MODEL_MATRIX = LIBS.get_I4();
      var LEAF_LOWER3_MODEL_MATRIX = LIBS.get_I4();
      var LEAF_UPPER3_MODEL_MATRIX = LIBS.get_I4();
      var CASTLE_MODEL_MATRIX = LIBS.get_I4();
      var CASTLE_OUTER_MODEL_MATRIX = LIBS.get_I4();
      var CASTLE_OUTER2_MODEL_MATRIX = LIBS.get_I4();
      var CASTILE_OUTER3_MODEL_MATRIX = LIBS.get_I4();
      var CASTLE_OUTER4_MODEL_MATRIX = LIBS.get_I4();
      var CASTLE_OUTER5_MODEL_MATRIX = LIBS.get_I4();
      var ROAD_MODEL_MATRIX = LIBS.get_I4();
      var OUTER_ROAD_MODEL_MATRIX = LIBS.get_I4();
      var OUTER_ROAD2_MODEL_MATRIX = LIBS.get_I4();
      var OUTER_ROAD3_MODEL_MATRIX = LIBS.get_I4();
      var OUTER_ROAD4_MODEL_MATRIX = LIBS.get_I4();
      var OUTER_ROAD5_MODEL_MATRIX = LIBS.get_I4();
      var OUTER_ROAD6_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS1_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS2_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS3_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS4_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS5_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS6_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS7_MODEL_MATRIX = LIBS.get_I4();
      var ROOTS8_MODEL_MATRIX = LIBS.get_I4();
      var ROCKS_MODEL_MATRIX = LIBS.get_I4();
      var ROCKS2_MODEL_MATRIX = LIBS.get_I4();
      var ROCKS3_MODEL_MATRIX = LIBS.get_I4();
      var ROCKS4_MODEL_MATRIX = LIBS.get_I4();
      var ROCKS5_MODEL_MATRIX = LIBS.get_I4();
      var ROCKS6_MODEL_MATRIX = LIBS.get_I4();
      var BOO_MODEL_MATRIX = LIBS.get_I4();
      var BOO_EYES_MODEL_MATRIX = LIBS.get_I4();
      var BOO_EYES2_MODEL_MATRIX = LIBS.get_I4();
      var BOO_CROWN_HAT_MODEL_MATRIX = LIBS.get_I4();
      var BOO_PUPIL_MODEL_MATRIX = LIBS.get_I4();
      var BOO_TEETH_MODEL_MATRIX = LIBS.get_I4();
      var BOO_TEETH2_MODEL_MATRIX = LIBS.get_I4();
      var BOO_PUPIL2_MODEL_MATRIX = LIBS.get_I4();
      var BOO_HAND_MODEL_MATRIX = LIBS.get_I4();
      var BOO_HAND2_MODEL_MATRIX = LIBS.get_I4();
      var BOO_TAIL_MODEL_MATRIX = LIBS.get_I4();
      var BOO_CROWN_MODEL_MATRIX = LIBS.get_I4();
      var BOO_CROWN2_MODEL_MATRIX = LIBS.get_I4();
      var BOO_CROWN3_MODEL_MATRIX = LIBS.get_I4();
      var BOO_TONGUE_MODEL_MATRIX = LIBS.get_I4();
      var MODEL_MATRIX82 = LIBS.get_I4();
      var MODEL_MATRIX83 = LIBS.get_I4();
      var BOO_MOUTH_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_MOUTH_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_BROW_MODEL_MATRIX = LIBS.get_I4();
      var GOOMBA_BROW2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_WING_CURVE_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_WING_CURVE2_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_BROW_MODEL_MATRIX = LIBS.get_I4();
      var POKIO_BROW2_MODEL_MATRIX = LIBS.get_I4();
      var BOO_BROW_MODEL_MATRIX = LIBS.get_I4();
      var BOO_BROW2_MODEL_MATRIX = LIBS.get_I4();
      var CASTLE_DOOR_MODEL_MATRIX = LIBS.get_I4();
      


      LIBS.translateZ(VIEW_MATRIX,-40);


      var goomba = new MyObject(goombaBody, goombaBodyFaces, shader_vertex_source, shader_fragment_source);
      goomba.setup();
      var goombaFeet1 = new MyObject(goombaFeet, goombaFeetFaces, shader_vertex_source, shader_fragment_source);
      goombaFeet1.setup();
      var goombaFeet2 = new MyObject(goombaFeet, goombaFeetFaces, shader_vertex_source, shader_fragment_source);
      goombaFeet2.setup();
      var goombaEyes1 = new MyObject(goombaEyes, goombaEyesFaces, shader_vertex_source, shader_fragment_source);
      goombaEyes1.setup();
      var goombaEyes2 = new MyObject(goombaEyes, goombaEyesFaces, shader_vertex_source, shader_fragment_source);
      goombaEyes2.setup();
      var goombaPupil1 = new MyObject(goombaPupil, goombaPupilFaces, shader_vertex_source, shader_fragment_source);
      goombaPupil1.setup();
      var goombaPupil2 = new MyObject(goombaPupil, goombaPupilFaces, shader_vertex_source, shader_fragment_source);
      goombaPupil2.setup();
      var goombaTeeth1 = new MyObject(goombaTeeth, goombaTeethFaces, shader_vertex_source, shader_fragment_source);
      goombaTeeth1.setup();
      var goombaTeeth2 = new MyObject(goombaTeeth, goombaTeethFaces, shader_vertex_source, shader_fragment_source);
      goombaTeeth2.setup();
      
      var goombaMouth = [
        //depan  kanan  atas
        0.7, 0, 1, 0, 0, 0,
        0, 1, 1, 0, 0, 0,
        -0.7, 0, 1, 0, 0, 0,
    ];
  
      var goombaMouth = new MyObject(buatKurva3D(goombaMouth, 0.1).vertices, buatKurva3D(goombaMouth, 1).indices, shader_vertex_source, shader_fragment_source);
      goombaMouth.setup();

      var goombaBrow = [
      //depan  kanan  atas
      0.7, 1, 1, 0, 0, 0,
      -0.3, 2, 1, 0, 0, 0,
      -0.7, 1.3, 1, 0, 0, 0,
      ];

      var goombaBrow1 = new MyObject(buatKurva3D(goombaBrow, 0.1).vertices, buatKurva3D(goombaBrow, 1).indices, shader_vertex_source, shader_fragment_source);
      goombaBrow1.setup();

      var goombaBroww = [
        //depan  kanan  atas
      0.7, 1.3, 1, 0, 0, 0,
      0.3, 2, 1, 0, 0, 0,
      -0.7, 1, 1, 0, 0, 0,
      ];

      var goombaBrow2 = new MyObject(buatKurva3D(goombaBroww, 0.1).vertices, buatKurva3D(goombaBroww, 1).indices, shader_vertex_source, shader_fragment_source);
      goombaBrow2.setup();


      var pokio = new MyObject(pokioBody, pokioBodyFaces, shader_vertex_source, shader_fragment_source);
      pokio.setup();
      var pokioFeet1 = new MyObject(pokioFeet, pokioFeetFaces, shader_vertex_source, shader_fragment_source);
      pokioFeet1.setup();
      var pokioFeet2 = new MyObject(pokioFeet, pokioFeetFaces, shader_vertex_source, shader_fragment_source);
      pokioFeet2.setup();
      var pokioEyes1 = new MyObject(pokioEyes, pokioEyesFaces, shader_vertex_source, shader_fragment_source);
      pokioEyes1.setup();
      var pokioEyes2 = new MyObject(pokioEyes, pokioEyesFaces, shader_vertex_source, shader_fragment_source);
      pokioEyes2.setup();
      var pokioTail1 = new MyObject(pokioTail, pokioTailFaces, shader_vertex_source, shader_fragment_source);
      pokioTail1.setup();
      var pokioBeak1 = new MyObject(pokioBeak, pokioBeakFaces, shader_vertex_source, shader_fragment_source);
      pokioBeak1.setup();
      var pokioRed1 = new MyObject(pokioRed, pokioRedFaces, shader_vertex_source, shader_fragment_source);
      pokioRed1.setup();
      var pokioRed2 = new MyObject(pokioRed, pokioRedFaces, shader_vertex_source, shader_fragment_source);
      pokioRed2.setup();
      var pokioNail1 = new MyObject(pokioNail, pokioNailFaces, shader_vertex_source, shader_fragment_source);
      pokioNail1.setup();
      var pokioNail2 = new MyObject(pokioNail, pokioNailFaces, shader_vertex_source, shader_fragment_source);
      pokioNail2.setup();
      var pokioNail3 = new MyObject(pokioNail, pokioNailFaces, shader_vertex_source, shader_fragment_source);
      pokioNail3.setup();
      var pokioNail4 = new MyObject(pokioNail, pokioNailFaces, shader_vertex_source, shader_fragment_source);
      pokioNail4.setup();
      var pokioHat1 = new MyObject(pokioHat, pokioHatFaces, shader_vertex_source, shader_fragment_source);
      pokioHat1.setup();
      var pokioOuterHat1 = new MyObject(pokioOuterHat, pokioOuterHatFaces, shader_vertex_source, shader_fragment_source);
      pokioOuterHat1.setup();
      var pokioTopHat1 = new MyObject(pokioTopHat, pokioTopHatFaces, shader_vertex_source, shader_fragment_source);
      pokioTopHat1.setup();
      var pokioWing1 = new MyObject(pokioWing, pokioWingFaces, shader_vertex_source, shader_fragment_source);
      pokioWing1.setup();
      var pokioWing2 = new MyObject(pokioWing, pokioWingFaces, shader_vertex_source, shader_fragment_source);
      pokioWing2.setup();
      var pokioOuterWing1 = new MyObject(pokioOuterWing, pokioOuterWingFaces, shader_vertex_source, shader_fragment_source);
      pokioOuterWing1.setup();
      var pokioOuterWing2 = new MyObject(pokioOuterWing, pokioOuterWingFaces, shader_vertex_source, shader_fragment_source);
      pokioOuterWing2.setup();

      var pokioWingCurve1 = [
        //depan  kanan  atas
        0.7, 0, 1, 0.9, 0.65, 0.7,
        0, -0.15, 1, 0.9, 0.65, 0.7,
        -0.7, 0, 1, 0.9, 0.65, 0.7,
    ];
  
      var pokioWingCurve1 = new MyObject(buatKurva3D(pokioWingCurve1, 0.03).vertices, buatKurva3D(pokioWingCurve1, 1).indices, shader_vertex_source, shader_fragment_source);
    pokioWingCurve1.setup();

    var pokioWingCurve2 = [
      //depan  kanan  atas
      -0.7, 0, 1, 0.9, 0.65, 0.7,
      0, -0.15, 1, 0.9, 0.65, 0.7,
      0.7, 0, 1, 0.9, 0.65, 0.7,
  ];
      
  var pokioWingCurve2 = new MyObject(buatKurva3D(pokioWingCurve2, 0.03).vertices, buatKurva3D(pokioWingCurve2, 1).indices, shader_vertex_source, shader_fragment_source);
    pokioWingCurve2.setup();


    var pokioBrow1 = [
      //depan  kanan  atas
      0.2, 0, 1, 0, 0, 0,
      0, 0.2, 1, 0, 0, 0,
      -0.2, 0, 1, 0, 0, 0,
  ];

    var pokioBrow1 = new MyObject(buatKurva3D(pokioBrow1, 0.04).vertices, buatKurva3D(pokioBrow1, 1).indices, shader_vertex_source, shader_fragment_source);
  pokioBrow1.setup();

  var pokioBrow2 = [
    //depan  kanan  atas
    -0.2, 0, 1, 0, 0, 0,
    0, 0.2, 1, 0, 0, 0,
    0.2, 0, 1, 0, 0, 0,
];
    
var pokioBrow2 = new MyObject(buatKurva3D(pokioBrow2, 0.04).vertices, buatKurva3D(pokioBrow2, 1).indices, shader_vertex_source, shader_fragment_source);
  pokioBrow2.setup();

      var Boo = new MyObject(Boobody, BooBodyFaces, shader_vertex_source, shader_fragment_source);
      Boo.setup();
      var BooEyes1 = new MyObject(BooEyes, BooEyesFaces, shader_vertex_source, shader_fragment_source);
      BooEyes1.setup();
      var BooEyes2 = new MyObject(BooEyes, BooEyesFaces, shader_vertex_source, shader_fragment_source);
      BooEyes2.setup();
     var BooCrownHat = new MyObject(BooCrownHat, BooCrownHatFaces, shader_vertex_source, shader_fragment_source);
     BooCrownHat.setup();
      // var BooTeeth1 = new MyObject(BooTeeth, BooTeethFaces, shader_vertex_source, shader_fragment_source);
      // BooTeeth1.setup();
      var BooTeeth2 = new MyObject(BooTeeth, BooTeethFaces, shader_vertex_source, shader_fragment_source);
      BooTeeth2.setup();
      var BooTeeth3 = new MyObject(BooTeeth, BooTeethFaces, shader_vertex_source, shader_fragment_source);
      BooTeeth3.setup();
      // var BooTeeth4 = new MyObject(BooTeeth, BooHandFaces, shader_vertex_source, shader_fragment_source);
      // BooTeeth4.setup();
      var BooHand1 = new MyObject(BooHand, BooHandFaces, shader_vertex_source, shader_fragment_source);
      BooHand1.setup();
      var BooHand2 = new MyObject(BooHand, BooHandFaces, shader_vertex_source, shader_fragment_source);
      BooHand2.setup();
      // var BooBrow1 = new MyObject(BooBrow, BooBrowFaces, shader_vertex_source, shader_fragment_source);
      // BooBrow1.setup();
      // var BooBrow2 = new MyObject(BooBrow, BooBrowFaces, shader_vertex_source, shader_fragment_source);
      // BooBrow2.setup();
      var BooTail = new MyObject(BooTail, BooTailFaces, shader_vertex_source, shader_fragment_source);
      BooTail.setup();
      var BooCrown1 = new MyObject(BooCrown, BooCrownFaces, shader_vertex_source, shader_fragment_source);
      BooCrown1.setup();
      var BooCrown2 = new MyObject(BooCrown, BooCrownFaces, shader_vertex_source, shader_fragment_source);
      BooCrown2.setup();
      var BooCrown3 = new MyObject(BooCrown, BooCrownFaces, shader_vertex_source, shader_fragment_source);
      BooCrown3.setup();
      var BooTongue = new MyObject(BooTongue, BooTongueFaces, shader_vertex_source, shader_fragment_source);
      BooTongue.setup();
      var BooMouth = new MyObject(BooMouth, BooMouthFaces, shader_vertex_source, shader_fragment_source);
      BooMouth.setup();
      var BooPupil1 = new MyObject(BooPupil, BooPupilFaces, shader_vertex_source, shader_fragment_source);
      BooPupil1.setup();
      var BooPupil2 = new MyObject(BooPupil, BooPupilFaces, shader_vertex_source, shader_fragment_source);
      BooPupil2.setup();

      var booBrow1 = [
        //depan  kanan  atas
        0.2, 0, 1, 0, 0, 0,
        0, -0.2, 1, 0, 0, 0,
        -0.3, 0, 1, 0, 0, 0,
    ];
  
      var BooBrow1 = new MyObject(buatKurva3D(booBrow1, 0.04).vertices, buatKurva3D(booBrow1, 1).indices, shader_vertex_source, shader_fragment_source);
    BooBrow1.setup();
  
    var booBrow2 = [
      //depan  kanan  atas
      -0.2, 0, 1, 0, 0, 0,
      0, -0.2, 1, 0, 0, 0,
      0.2, 0, 1, 0, 0, 0,
  ];
      
  var BooBrow2 = new MyObject(buatKurva3D(booBrow2, 0.04).vertices, buatKurva3D(booBrow2, 1).indices, shader_vertex_source, shader_fragment_source);
    BooBrow2.setup();

      var ground = new MyObject(ground, groundFaces, shader_vertex_source, shader_fragment_source);
      ground.setup();
      var log1 = new MyObject(log, logFaces, shader_vertex_source, shader_fragment_source);
      log1.setup();
      var leafLower1 = new MyObject(leaf, leafFaces, shader_vertex_source, shader_fragment_source);
      leafLower1.setup();
      var leafUpper1 = new MyObject(leaf, leafFaces, shader_vertex_source, shader_fragment_source);
      leafUpper1.setup();
      var log2 = new MyObject(log, logFaces, shader_vertex_source, shader_fragment_source);
      log2.setup();
      var leafLower2 = new MyObject(leaf, leafFaces, shader_vertex_source, shader_fragment_source);
      leafLower2.setup();
      var leafUpper2 = new MyObject(leaf, leafFaces, shader_vertex_source, shader_fragment_source);
      leafUpper2.setup();
      var log3 = new MyObject(log, logFaces, shader_vertex_source, shader_fragment_source);
      log3.setup();
      var leafLower3 = new MyObject(leaf, leafFaces, shader_vertex_source, shader_fragment_source);
      leafLower3.setup();
      var leafUpper3 = new MyObject(leaf, leafFaces, shader_vertex_source, shader_fragment_source);
      leafUpper3.setup();

      var castle = new MyObject(castleBody,castleBodyFaces,shader_vertex_source,shader_fragment_source);
      castle.setup();
      var castleOuter1 = new MyObject(castleData, castleDataFaces, shader_vertex_source, shader_fragment_source);
      castleOuter1.setup();
      var castleOuter2 = new MyObject(castleData, castleDataFaces, shader_vertex_source, shader_fragment_source);
      castleOuter2.setup();
      var castleOuter3 = new MyObject(castleData, castleDataFaces, shader_vertex_source, shader_fragment_source);
      castleOuter3.setup();
      var castleOuter4 = new MyObject(castleData, castleDataFaces, shader_vertex_source, shader_fragment_source);
      castleOuter4.setup();
      var castleOuter5 = new MyObject(castleData, castleDataFaces, shader_vertex_source, shader_fragment_source);
      castleOuter5.setup();
      var road = new MyObject(roadBody,roadBodyFaces,shader_vertex_source,shader_fragment_source);
      road.setup();
      var outerRoad1 = new MyObject(outerRoadBody,outerRoadFaces,shader_vertex_source,shader_fragment_source);
      outerRoad1.setup();
      var outerRoad2 = new MyObject(outerRoadBody,outerRoadFaces,shader_vertex_source,shader_fragment_source);
      outerRoad2.setup();
      var outerRoad3 = new MyObject(outerRoadBody,outerRoadFaces,shader_vertex_source,shader_fragment_source);
      outerRoad3.setup();
      var outerRoad4 = new MyObject(outerRoadBody,outerRoadFaces,shader_vertex_source,shader_fragment_source);
      outerRoad4.setup();
      var outerRoad5 = new MyObject(outerRoadBody,outerRoadFaces,shader_vertex_source,shader_fragment_source);
      outerRoad5.setup();
      var outerRoad6 = new MyObject(outerRoadBody,outerRoadFaces,shader_vertex_source,shader_fragment_source);
      outerRoad6.setup();

      var roots1 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots1.setup();
      var roots2 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots2.setup();
      var roots3 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots3.setup();
      var roots4 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots4.setup();
      var roots5 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots5.setup();
      var roots6 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots6.setup();
      var roots7 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots7.setup();
      var roots8 = new MyObject(rootsBody,rootsFaces,shader_vertex_source,shader_fragment_source);
      roots8.setup();

      var rocks1 = new MyObject(rocksBody,rocksFaces,shader_vertex_source,shader_fragment_source);
      rocks1.setup();
      var rocks2 = new MyObject(rocksBody,rocksFaces,shader_vertex_source,shader_fragment_source);
      rocks2.setup();
      var rocks3 = new MyObject(rocksBody,rocksFaces,shader_vertex_source,shader_fragment_source);
      rocks3.setup();
      var rocks4 = new MyObject(rocksBody,rocksFaces,shader_vertex_source,shader_fragment_source);
      rocks4.setup();
      var rocks5 = new MyObject(rocksBody,rocksFaces,shader_vertex_source,shader_fragment_source);
      rocks5.setup();
      var rocks6 = new MyObject(rocksBody,rocksFaces,shader_vertex_source,shader_fragment_source);
      rocks6.setup();

      var castleDoor = [
        //depan  kanan  atas
        -1.5, 0, 1, 0, 0, 0,
        0, 3.5, 1, 0, 0, 0,
        1.5, 0, 1, 0, 0, 0,
    ];
        
    var castleDoor1 = new MyObject(buatKurva3D(castleDoor, 0.3).vertices, buatKurva3D(castleDoor, 1).indices, shader_vertex_source, shader_fragment_source);
      castleDoor1.setup();

      
      

      goomba.child.push(goombaFeet1);
      goomba.child.push(goombaFeet2);
      goomba.child.push(goombaEyes1);
      goombaEyes1.child.push(goombaPupil1);
      goomba.child.push(goombaEyes2);
      goombaEyes2.child.push(goombaPupil2);
      goomba.child.push(goombaTeeth1);
      goomba.child.push(goombaTeeth2);
      goomba.child.push(goombaMouth);
      goomba.child.push(goombaBrow1);
      goomba.child.push(goombaBrow2);

      pokio.child.push(pokioFeet1);
      pokio.child.push(pokioFeet2);
      pokio.child.push(pokioEyes1);
      pokio.child.push(pokioEyes2);
      pokio.child.push(pokioTail1);
      pokio.child.push(pokioBeak1);
      pokio.child.push(pokioRed1);
      pokio.child.push(pokioRed2);
      pokioFeet1.child.push(pokioNail1);
      pokioFeet1.child.push(pokioNail2);
      pokioFeet2.child.push(pokioNail3);
      pokioFeet2.child.push(pokioNail4);
      pokio.child.push(pokioHat1);
      pokioHat1.child.push(pokioOuterHat1);
      pokioHat1.child.push(pokioTopHat1);
      pokio.child.push(pokioWing1);
      pokio.child.push(pokioWing2);
      pokioWing1.child.push(pokioOuterWing1);
      pokioWing2.child.push(pokioOuterWing2);
      pokio.child.push(pokioWingCurve1);
      pokio.child.push(pokioWingCurve2);
      pokio.child.push(pokioBrow1);
      pokio.child.push(pokioBrow2);

      Boo.child.push(BooEyes1);
      Boo.child.push(BooEyes2);
      Boo.child.push(BooCrownHat);
      BooEyes1.child.push(BooPupil1);
      BooEyes2.child.push(BooPupil2);
      Boo.child.push(BooTeeth2);
      Boo.child.push(BooTeeth3);
      Boo.child.push(BooHand1);
      Boo.child.push(BooHand2);
      Boo.child.push(BooBrow1);
      Boo.child.push(BooBrow2);
      Boo.child.push(BooTail);
      Boo.child.push(BooCrown1);
      Boo.child.push(BooCrown2);
      Boo.child.push(BooCrown3);
      Boo.child.push(BooTongue);
      Boo.child.push(BooMouth);

      castle.child.push(castleOuter1);
      castle.child.push(castleOuter2);
      castle.child.push(castleOuter3);
      castle.child.push(castleOuter4);
      castle.child.push(castleOuter5);


      /*========================= DRAWING ========================= */
      GL.clearColor(0.0, 0.0, 0.0, 0.0);


      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);
 
      var time_prev = 0;
      var animate = function(time) {
          GL.viewport(0, 0, CANVAS.width, CANVAS.height);
          GL.clear(GL.COLOR_BUFFER_BIT | GL.D_BUFFER_BIT);
          var dt = time-time_prev;
          time_prev=time;

          
          dX*=FRICTION;
          dY*=FRICTION;

          THETA += dX *2*Math.PI/CANVAS.width;
          ALPHA += dY * 2*Math.PI/CANVAS.height;
          

          WorldTHETA += WorlddX *2*Math.PI/CANVAS.width;
          WorldALPHA += WorlddY * 2*Math.PI/CANVAS.height;
          WorldZ += WorlddZ * 2*Math.PI/CANVAS.height;

          WorldPos[0] += WorlddX;
          WorldPos[1] += WorlddY;
          WorldPos[2] += WorlddZ;

          
          LIBS.translateX(VIEW_MATRIX, WorlddX);
          LIBS.translateY(VIEW_MATRIX, WorlddY);
          LIBS.translateZ(VIEW_MATRIX, WorlddZ);
          
          LIBS.translateX(VIEW_MATRIX, -WorldPos[0]);
          LIBS.translateZ(VIEW_MATRIX, -WorldPos[2]);
          LIBS.rotateX(VIEW_MATRIX, dY*0.1);
          LIBS.rotateY(VIEW_MATRIX, dX*0.1);
          LIBS.translateX(VIEW_MATRIX, WorldPos[0]);
          LIBS.translateZ(VIEW_MATRIX, WorldPos[2]);
          
          
          

          var radius = 1.5;
          var pos_x = radius * Math.cos(ALPHA)*Math.sin(THETA);
          var pos_y = radius * Math.sin(ALPHA);
          var pos_z = radius * Math.cos(ALPHA)*Math.cos(THETA);

          //posisi awal
          if (walkFront == true) {
            goombaPos[2] += goombaMoveSpeed;
            if(goombaPos[2] >= 10) {
              walkFront = false;
            }
          }
          else {
            goombaPos[2] -= goombaMoveSpeed;
            if(goombaPos[2] <= -10) {
              walkFront = true;
            }
          }

          MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(MODEL_MATRIX, 1);
          LIBS.translateZ(MODEL_MATRIX, goombaPos[2]);
          LIBS.rotateX(MODEL_MATRIX, 1.5);
          

          if (walkFront == false) {
            LIBS.rotateY(MODEL_MATRIX, Math.PI);
          }

          GOOMBA_FEET_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_FEET_MODEL_MATRIX, -1.75);
          LIBS.translateX(GOOMBA_FEET_MODEL_MATRIX, -0.8);
          LIBS.translateZ(GOOMBA_FEET_MODEL_MATRIX, goombaPos[2]);
          LIBS.rotateY(GOOMBA_FEET_MODEL_MATRIX, 1.5);

          goombaFeet1Pos[0] = -0.8;
          goombaFeet1Pos[1] = -1.75;
          goombaFeet1Pos[2] = goombaPos[2];


          GOOMBA_FEET2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_FEET2_MODEL_MATRIX, -1.75);
          LIBS.translateZ(GOOMBA_FEET2_MODEL_MATRIX, goombaPos[2]);
          LIBS.translateX(GOOMBA_FEET2_MODEL_MATRIX, 0.8);
          LIBS.rotateY(GOOMBA_FEET2_MODEL_MATRIX, 1.5);

          goombaFeet2Pos[0] = 0.8;
          goombaFeet2Pos[1] = -1.75;
          goombaFeet2Pos[2] = goombaPos[2];


          GOOMBA_EYES_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_EYES_MODEL_MATRIX, 0);
          LIBS.translateX(GOOMBA_EYES_MODEL_MATRIX, 0.6);
          LIBS.translateZ(GOOMBA_EYES_MODEL_MATRIX, goombaPos[2]);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_EYES_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_EYES_MODEL_MATRIX, 1);

          GOOMBA_EYES2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_EYES2_MODEL_MATRIX, 0);
          LIBS.translateX(GOOMBA_EYES2_MODEL_MATRIX, -0.6);
          LIBS.translateZ(GOOMBA_EYES2_MODEL_MATRIX, goombaPos[2]);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_EYES2_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_EYES2_MODEL_MATRIX, 1);

          GOOMBA_PUPIL_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_PUPIL_MODEL_MATRIX, 0);
          LIBS.translateX(GOOMBA_PUPIL_MODEL_MATRIX, -0.5);
          LIBS.translateZ(GOOMBA_PUPIL_MODEL_MATRIX, goombaPos[2]);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_PUPIL_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_PUPIL_MODEL_MATRIX, 1.3);

          GOOMBA_PUPIL2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_PUPIL2_MODEL_MATRIX, 0);
          LIBS.translateX(GOOMBA_PUPIL2_MODEL_MATRIX, 0.5);
          LIBS.translateZ(GOOMBA_PUPIL2_MODEL_MATRIX, goombaPos[2]);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_PUPIL2_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_PUPIL2_MODEL_MATRIX, 1.3);

          GOOMBA_TEETH_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_TEETH_MODEL_MATRIX, -0.8);
          LIBS.translateX(GOOMBA_TEETH_MODEL_MATRIX, 0.7);
          LIBS.translateZ(GOOMBA_TEETH_MODEL_MATRIX, goombaPos[2]);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_TEETH_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_TEETH_MODEL_MATRIX, 1.5);
          LIBS.rotateX(GOOMBA_TEETH_MODEL_MATRIX, 0.8);

          GOOMBA_TEETH2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_TEETH2_MODEL_MATRIX, -0.8);
          LIBS.translateX(GOOMBA_TEETH2_MODEL_MATRIX, -0.7);
          LIBS.translateZ(GOOMBA_TEETH2_MODEL_MATRIX, goombaPos[2]);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_TEETH2_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_TEETH2_MODEL_MATRIX, 1.5);
          LIBS.rotateX(GOOMBA_TEETH2_MODEL_MATRIX, 0.8);

          GOOMBA_MOUTH_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_MOUTH_MODEL_MATRIX, -1.15);
          LIBS.translateX(GOOMBA_MOUTH_MODEL_MATRIX, 0);
          LIBS.translateZ(GOOMBA_MOUTH_MODEL_MATRIX, goombaPos[2]);
          LIBS.rotateX(GOOMBA_MOUTH_MODEL_MATRIX, -0.4);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_MOUTH_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_MOUTH_MODEL_MATRIX, 0.7);


          GOOMBA_BROW_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_BROW_MODEL_MATRIX, -1.1);
          LIBS.translateX(GOOMBA_BROW_MODEL_MATRIX, -0.8);
          LIBS.translateZ(GOOMBA_BROW_MODEL_MATRIX, goombaPos[2]);
          LIBS.rotateX(GOOMBA_BROW_MODEL_MATRIX, -0.3);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_BROW_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_BROW_MODEL_MATRIX, 0.5);



          GOOMBA_BROW2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GOOMBA_BROW2_MODEL_MATRIX, -1.1);
          LIBS.translateX(GOOMBA_BROW2_MODEL_MATRIX, 0.8);
          LIBS.translateZ(GOOMBA_BROW2_MODEL_MATRIX, goombaPos[2]);
          LIBS.rotateX(GOOMBA_BROW2_MODEL_MATRIX, -0.3);
          if(walkFront == false) {
            LIBS.translateZ(GOOMBA_BROW2_MODEL_MATRIX, -2*goombaPos[2]);
          }
          LIBS.translateZ(GOOMBA_BROW2_MODEL_MATRIX, 0.5);


          if (walkFrontpokio == true) {
            pokioPos[2] += pokioMoveSpeed;
            if(pokioPos[2] >= 10) {
              walkFrontpokio = false;
            }
          }
          else {
            pokioPos[2] -= pokioMoveSpeed;
            if(pokioPos[2] <= -10) {
              walkFrontpokio = true;
            }
          }

          POKIO_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_MODEL_MATRIX, 0.1);
          LIBS.translateZ(POKIO_MODEL_MATRIX, pokioPos[2]);
          LIBS.rotateX(POKIO_MODEL_MATRIX, 1.5);
        //   LIBS.rotateY(MODEL_MATRIX, THETA);
        //   LIBS.rotateX(MODEL_MATRIX, ALPHA);
        //   LIBS.setPosition(MODEL_MATRIX,pos_x,pos_y,pos_z);

          POKIO_FEET_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_FEET_MODEL_MATRIX, -1.1);
          LIBS.translateX(POKIO_FEET_MODEL_MATRIX, -0.35);
          LIBS.translateZ(POKIO_FEET_MODEL_MATRIX, pokioPos[2]);
          // LIBS.rotateX(POKIO_FEET_MODEL_MATRIX, -ALPHA);
          // LIBS.rotateY(POKIO_FEET_MODEL_MATRIX, -THETA);

          pokioFeet1Pos[0] = -0.8;
          pokioFeet1Pos[1] = -1.75;
          pokioFeet1Pos[2] = pokioPos[2];
        //   LIBS.setPosition(POKIO_FEET_MODEL_MATRIX,-pos_x,-pos_y,-pos_z);

          POKIO_FEET2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_FEET2_MODEL_MATRIX, -1.1);
          LIBS.translateX(POKIO_FEET2_MODEL_MATRIX, 0.35);
          LIBS.translateZ(POKIO_FEET2_MODEL_MATRIX, pokioPos[2]);
          // LIBS.rotateX(POKIO_FEET2_MODEL_MATRIX, -ALPHA);
          // LIBS.rotateY(POKIO_FEET2_MODEL_MATRIX, -THETA);

          pokioFeet2Pos[0] = 0.8;
          pokioFeet2Pos[1] = -1.75;
          pokioFeet2Pos[2] = pokioPos[2];

          POKIO_EYES_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_EYES_MODEL_MATRIX, 0.05);
          LIBS.translateX(POKIO_EYES_MODEL_MATRIX, 0.3);
          LIBS.translateZ(POKIO_EYES_MODEL_MATRIX, 1.8);
          LIBS.translateZ(POKIO_EYES_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
            LIBS.translateZ(POKIO_EYES_MODEL_MATRIX, -2*pokioPos[2]);
          }
          LIBS.rotateZ(POKIO_EYES_MODEL_MATRIX, 0.2);

          POKIO_EYES2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_EYES2_MODEL_MATRIX, 0.05);
          LIBS.translateX(POKIO_EYES2_MODEL_MATRIX, -0.3);
          LIBS.translateZ(POKIO_EYES2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_EYES2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.translateZ(POKIO_EYES2_MODEL_MATRIX, 1.8);
          LIBS.rotateZ(POKIO_EYES2_MODEL_MATRIX, -0.2);

          POKIO_TAIL_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_TAIL_MODEL_MATRIX, -0.5);
          LIBS.translateX(POKIO_TAIL_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_TAIL_MODEL_MATRIX, -1.3);
          LIBS.translateZ(POKIO_TAIL_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_TAIL_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_TAIL_MODEL_MATRIX, -1.8);
          // LIBS.rotateX(POKIO_TAIL_MODEL_MATRIX, 0.8);
          LIBS.rotateY(POKIO_TAIL_MODEL_MATRIX, 0);

          POKIO_BEAK_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_BEAK_MODEL_MATRIX, -0.5);
          LIBS.translateX(POKIO_BEAK_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_BEAK_MODEL_MATRIX, 1);
          LIBS.translateZ(POKIO_BEAK_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_BEAK_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_BEAK_MODEL_MATRIX, 1.6);
          LIBS.rotateY(POKIO_BEAK_MODEL_MATRIX, 0);

          POKIO_RED_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_RED_MODEL_MATRIX, -0.1);
          LIBS.translateX(POKIO_RED_MODEL_MATRIX, 0.5);
          LIBS.translateZ(POKIO_RED_MODEL_MATRIX, 1.5);
          LIBS.translateZ(POKIO_RED_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_RED_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_RED_MODEL_MATRIX, 1.6);
          // LIBS.rotateX(POKIO_RED_MODEL_MATRIX, 0.8);
          LIBS.rotateY(POKIO_RED_MODEL_MATRIX, 2);
          LIBS.rotateZ(POKIO_RED_MODEL_MATRIX, 0.4);


          POKIO_RED2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_RED2_MODEL_MATRIX, -0.1);
          LIBS.translateX(POKIO_RED2_MODEL_MATRIX, -0.5);
          LIBS.translateZ(POKIO_RED2_MODEL_MATRIX, 1.5);
          LIBS.translateZ(POKIO_RED2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_RED2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_RED2_MODEL_MATRIX, 1.6);
          // LIBS.rotateX(POKIO_RED2_MODEL_MATRIX, 0.8);
          LIBS.rotateY(POKIO_RED2_MODEL_MATRIX, -2);
          LIBS.rotateZ(POKIO_RED2_MODEL_MATRIX, -0.4);

          POKIO_NAIL_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_NAIL_MODEL_MATRIX, -1.65);
          LIBS.translateX(POKIO_NAIL_MODEL_MATRIX, -0.75);
          LIBS.translateZ(POKIO_NAIL_MODEL_MATRIX, 1.3);
          LIBS.translateZ(POKIO_NAIL_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_NAIL_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_NAIL_MODEL_MATRIX, 9.7);
          LIBS.rotateY(POKIO_NAIL_MODEL_MATRIX, -0.3);
          LIBS.rotateZ(POKIO_NAIL_MODEL_MATRIX, 0);
          pokioFeet2Pos[0] = 0.8;
          pokioFeet2Pos[1] = -1.75;
          pokioFeet2Pos[2] = pokioPos[2];

          POKIO_NAIL2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_NAIL2_MODEL_MATRIX, -1.65);
          LIBS.translateX(POKIO_NAIL2_MODEL_MATRIX, -0.3);
          LIBS.translateZ(POKIO_NAIL2_MODEL_MATRIX, 1.3);
          LIBS.translateZ(POKIO_NAIL2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_NAIL2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_NAIL2_MODEL_MATRIX, 9.7);
          LIBS.rotateY(POKIO_NAIL2_MODEL_MATRIX, 0.1);
          LIBS.rotateZ(POKIO_NAIL2_MODEL_MATRIX, 0);
          pokioFeet2Pos[0] = 0.8;
          pokioFeet2Pos[1] = -1.75;
          pokioFeet2Pos[2] = pokioPos[2];

          POKIO_NAIL3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_NAIL3_MODEL_MATRIX, -1.65);
          LIBS.translateX(POKIO_NAIL3_MODEL_MATRIX, 0.3);
          LIBS.translateZ(POKIO_NAIL3_MODEL_MATRIX, 1.3);
          LIBS.translateZ(POKIO_NAIL3_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_NAIL3_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_NAIL3_MODEL_MATRIX, 9.7);
          LIBS.rotateY(POKIO_NAIL3_MODEL_MATRIX, -0.05);
          LIBS.rotateZ(POKIO_NAIL3_MODEL_MATRIX, 0);
          pokioFeet2Pos[0] = 0.8;
          pokioFeet2Pos[1] = -1.75;
          pokioFeet2Pos[2] = pokioPos[2];

          POKIO_NAIL4_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_NAIL4_MODEL_MATRIX, -1.65);
          LIBS.translateX(POKIO_NAIL4_MODEL_MATRIX, 0.75);
          LIBS.translateZ(POKIO_NAIL4_MODEL_MATRIX, 1.3);
          LIBS.translateZ(POKIO_NAIL4_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_NAIL4_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_NAIL4_MODEL_MATRIX, 9.7);
          LIBS.rotateY(POKIO_NAIL4_MODEL_MATRIX, 0.3);
          LIBS.rotateZ(POKIO_NAIL4_MODEL_MATRIX, 0);
          pokioFeet2Pos[0] = 0.8;
          pokioFeet2Pos[1] = -1.75;
          pokioFeet2Pos[2] = pokioPos[2];

          POKIO_HAT_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_HAT_MODEL_MATRIX, 1.75);
          LIBS.translateX(POKIO_HAT_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_HAT_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_HAT_MODEL_MATRIX, pokioPos[2]);
          LIBS.rotateX(POKIO_HAT_MODEL_MATRIX, 1.55);
          LIBS.rotateY(POKIO_HAT_MODEL_MATRIX, 0);
          LIBS.rotateZ(POKIO_HAT_MODEL_MATRIX, 0);
          
          POKIO_OUTER_HAT_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_OUTER_HAT_MODEL_MATRIX, 0.88);
          LIBS.translateX(POKIO_OUTER_HAT_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_OUTER_HAT_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_OUTER_HAT_MODEL_MATRIX, pokioPos[2]);
          LIBS.rotateX(POKIO_OUTER_HAT_MODEL_MATRIX, 0);
          LIBS.rotateY(POKIO_OUTER_HAT_MODEL_MATRIX, 0.03);
          LIBS.rotateZ(POKIO_OUTER_HAT_MODEL_MATRIX, 1.57);

          POKIO_TOP_HAT_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_TOP_HAT_MODEL_MATRIX, 1.7);
          LIBS.translateX(POKIO_TOP_HAT_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_TOP_HAT_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_TOP_HAT_MODEL_MATRIX, pokioPos[2]);
          LIBS.rotateX(POKIO_TOP_HAT_MODEL_MATRIX, 0);
          LIBS.rotateY(POKIO_TOP_HAT_MODEL_MATRIX, 0);
          LIBS.rotateZ(POKIO_TOP_HAT_MODEL_MATRIX, 0);

          POKIO_WING_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_WING_MODEL_MATRIX, -0.3);
          LIBS.translateX(POKIO_WING_MODEL_MATRIX, -1.6);
          LIBS.translateZ(POKIO_WING_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_WING_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_WING_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_WING_MODEL_MATRIX, 1.8);
          LIBS.rotateY(POKIO_WING_MODEL_MATRIX, 0);
          LIBS.rotateZ(POKIO_WING_MODEL_MATRIX, 0);

          POKIO_WING2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_WING2_MODEL_MATRIX, -0.3);
          LIBS.translateX(POKIO_WING2_MODEL_MATRIX, 1.6);
          LIBS.translateZ(POKIO_WING2_MODEL_MATRIX, 0);
          LIBS.translateZ(POKIO_WING2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_WING2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_WING2_MODEL_MATRIX, 1.8);
          LIBS.rotateY(POKIO_WING2_MODEL_MATRIX, 0);
          LIBS.rotateZ(POKIO_WING2_MODEL_MATRIX, 0);

          POKIO_OUTER_WING_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_OUTER_WING_MODEL_MATRIX, -0.15);
          LIBS.translateX(POKIO_OUTER_WING_MODEL_MATRIX, -1.6);
          LIBS.translateZ(POKIO_OUTER_WING_MODEL_MATRIX, -0.4);
          LIBS.translateZ(POKIO_OUTER_WING_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_OUTER_WING_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_OUTER_WING_MODEL_MATRIX, -1.1);
          LIBS.rotateY(POKIO_OUTER_WING_MODEL_MATRIX, 0);
          LIBS.rotateZ(POKIO_OUTER_WING_MODEL_MATRIX, 0);

          POKIO_OUTER_WING2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_OUTER_WING2_MODEL_MATRIX, -0.15);
          LIBS.translateX(POKIO_OUTER_WING2_MODEL_MATRIX, 1.6);
          LIBS.translateZ(POKIO_OUTER_WING2_MODEL_MATRIX, -0.4);
          LIBS.translateZ(POKIO_OUTER_WING2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_OUTER_WING2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_OUTER_WING2_MODEL_MATRIX, -1.1);
          LIBS.rotateY(POKIO_OUTER_WING2_MODEL_MATRIX, 0);
          LIBS.rotateZ(POKIO_OUTER_WING2_MODEL_MATRIX, 0);

          POKIO_WING_CURVE_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_WING_CURVE_MODEL_MATRIX, 0);
          LIBS.translateX(POKIO_WING_CURVE_MODEL_MATRIX, -0.82);
          LIBS.translateZ(POKIO_WING_CURVE_MODEL_MATRIX, -0.4);
          LIBS.translateZ(POKIO_WING_CURVE_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_WING_CURVE_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateY(POKIO_WING_CURVE_MODEL_MATRIX, -1.7);
          LIBS.rotateX(POKIO_WING_CURVE_MODEL_MATRIX, 0.3);


          POKIO_WING_CURVE2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_WING_CURVE2_MODEL_MATRIX, 0);
          LIBS.translateX(POKIO_WING_CURVE2_MODEL_MATRIX, 0.82);
          LIBS.translateZ(POKIO_WING_CURVE2_MODEL_MATRIX, -0.4);
          LIBS.translateZ(POKIO_WING_CURVE2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_WING_CURVE2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateY(POKIO_WING_CURVE2_MODEL_MATRIX, 1.7);
          LIBS.rotateX(POKIO_WING_CURVE2_MODEL_MATRIX, 0.3);

          POKIO_BROW_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_BROW_MODEL_MATRIX, 0.3);
          LIBS.translateX(POKIO_BROW_MODEL_MATRIX, -0.32);
          LIBS.translateZ(POKIO_BROW_MODEL_MATRIX, 0.75);
          LIBS.translateZ(POKIO_BROW_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_BROW_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_BROW_MODEL_MATRIX, -0.1);
          LIBS.rotateZ(POKIO_BROW_MODEL_MATRIX, -0.2);


          POKIO_BROW2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(POKIO_BROW2_MODEL_MATRIX, 0.3);
          LIBS.translateX(POKIO_BROW2_MODEL_MATRIX, 0.32);
          LIBS.translateZ(POKIO_BROW2_MODEL_MATRIX, 0.75);
          LIBS.translateZ(POKIO_BROW2_MODEL_MATRIX, pokioPos[2]);
          if(walkFrontpokio == false) {
              LIBS.translateZ(POKIO_BROW2_MODEL_MATRIX, -2*pokioPos[2]);
            }
          LIBS.rotateX(POKIO_BROW2_MODEL_MATRIX, -0.1);
          LIBS.rotateZ(POKIO_BROW2_MODEL_MATRIX, 0.2);

          // if (booRaise == true) {
          //   booCounter += booRaiseSpeed;
          //   if (booCounter >= 2.2) {
          //     booRaise = false;
          //   }
          // } else {
          //   booCounter -= booRaiseSpeed;
          //   if (booCounter <= -2.2) {
          //     booRaise = true;
          //   }
          // }
          booCounter += booRaiseSpeed;

          BOO_MODEL_MATRIX = LIBS.get_I4();
          LIBS.rotateX(BOO_MODEL_MATRIX, 1.5);
          LIBS.translateY(BOO_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_EYES_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_EYES_MODEL_MATRIX, 0.25);
          LIBS.translateZ(BOO_EYES_MODEL_MATRIX, 1);
          LIBS.translateY(BOO_EYES_MODEL_MATRIX, 0.2)
          LIBS.translateY(BOO_EYES_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_EYES2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_EYES2_MODEL_MATRIX, -0.25);
          LIBS.translateZ(BOO_EYES2_MODEL_MATRIX, 1);
          LIBS.translateY(BOO_EYES2_MODEL_MATRIX, 0.2)
          LIBS.translateY(BOO_EYES2_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_CROWN_HAT_MODEL_MATRIX = LIBS.get_I4();
          LIBS.rotateX(BOO_CROWN_HAT_MODEL_MATRIX, -1.5);
          LIBS.translateY(BOO_CROWN_HAT_MODEL_MATRIX, -0.1);
          LIBS.translateY(BOO_CROWN_HAT_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_PUPIL_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(BOO_PUPIL_MODEL_MATRIX, 1.1);
          LIBS.translateY(BOO_PUPIL_MODEL_MATRIX, 0.28);
          LIBS.translateX(BOO_PUPIL_MODEL_MATRIX, 0.25);
          LIBS.translateY(BOO_PUPIL_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_TEETH_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_TEETH_MODEL_MATRIX, -0.25);
          LIBS.rotateX(BOO_TEETH_MODEL_MATRIX, 2.5)
          LIBS.translateZ(BOO_TEETH_MODEL_MATRIX, 0.9);
          LIBS.translateY(BOO_TEETH_MODEL_MATRIX, -0.32);
          LIBS.translateY(BOO_TEETH_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_TEETH2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_TEETH2_MODEL_MATRIX, 0.25);
          LIBS.rotateX(BOO_TEETH2_MODEL_MATRIX, 2.5);
          LIBS.translateZ(BOO_TEETH2_MODEL_MATRIX, 0.9);
          LIBS.translateY(BOO_TEETH2_MODEL_MATRIX, -0.32);
          LIBS.translateY(BOO_TEETH2_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_PUPIL2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(BOO_PUPIL2_MODEL_MATRIX, 1.1);
          LIBS.translateY(BOO_PUPIL2_MODEL_MATRIX, 0.28);
          LIBS.translateX(BOO_PUPIL2_MODEL_MATRIX, -0.25);
          LIBS.translateY(BOO_PUPIL2_MODEL_MATRIX, 2*Math.sin(booCounter));

          if (booHandRaise == true) {
            booHandCounter += booHandRaiseSpeed;
            if (booHandCounter >= 0.6) {
              booHandRaise = false;
            }
          } else {
            booHandCounter -= booHandRaiseSpeed;
            if (booHandCounter <= -0.6) {
              booHandRaise = true;
            }
          }

          BOO_HAND_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_HAND_MODEL_MATRIX, 1.5);
          LIBS.rotateY(BOO_HAND_MODEL_MATRIX, -1.5);
          LIBS.rotateZ(BOO_HAND_MODEL_MATRIX, 0.3);
          LIBS.scale(BOO_HAND_MODEL_MATRIX, 1, 1, 2);
          LIBS.translateY(BOO_HAND_MODEL_MATRIX, booHandCounter);
          LIBS.rotateZ(BOO_HAND_MODEL_MATRIX, booHandCounter);
          LIBS.translateY(BOO_HAND_MODEL_MATRIX, 2*Math.sin(booCounter));
          
          BOO_HAND2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_HAND2_MODEL_MATRIX, -1.5);
          LIBS.rotateY(BOO_HAND2_MODEL_MATRIX, 1.5);
          LIBS.rotateZ(BOO_HAND2_MODEL_MATRIX, -0.3);
          LIBS.scale(BOO_HAND2_MODEL_MATRIX, 1, 1, 2);
          LIBS.translateY(BOO_HAND2_MODEL_MATRIX, booHandCounter);
          LIBS.rotateZ(BOO_HAND2_MODEL_MATRIX, -booHandCounter);
          LIBS.translateY(BOO_HAND2_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_TAIL_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(BOO_TAIL_MODEL_MATRIX, -0.1);
          LIBS.rotateX(BOO_TAIL_MODEL_MATRIX, 0.23);
          LIBS.translateZ(BOO_TAIL_MODEL_MATRIX, -1.28);
          LIBS.translateY(BOO_TAIL_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_CROWN_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(BOO_CROWN_MODEL_MATRIX, 0.37);
          LIBS.translateY(BOO_CROWN_MODEL_MATRIX, 0.3);
          LIBS.translateY(BOO_CROWN_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_CROWN2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(BOO_CROWN2_MODEL_MATRIX, 0.33);
          LIBS.translateX(BOO_CROWN2_MODEL_MATRIX, -0.37);
          LIBS.translateY(BOO_CROWN2_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_CROWN3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(BOO_CROWN3_MODEL_MATRIX, 0.5);
          LIBS.translateZ(BOO_CROWN3_MODEL_MATRIX, 0.28);
          LIBS.translateY(BOO_CROWN3_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_TONGUE_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(BOO_TONGUE_MODEL_MATRIX, -0.53);
          LIBS.translateZ(BOO_TONGUE_MODEL_MATRIX, 0.82);
          LIBS.rotateX(BOO_TONGUE_MODEL_MATRIX, 0);
          LIBS.rotateY(BOO_TONGUE_MODEL_MATRIX, 1.58);
          LIBS.translateY(BOO_TONGUE_MODEL_MATRIX, 2*Math.sin(booCounter));

          // MODEL_MATRIX82 = LIBS.get_I4();
          // LIBS.translateY(MODEL_MATRIX82, 0.5);
          // LIBS.translateZ(MODEL_MATRIX82, 0.9); 
          // LIBS.translateX(MODEL_MATRIX82, -0.3);
          // LIBS.rotateY(MODEL_MATRIX82, 2.5);
          // LIBS.rotateZ(MODEL_MATRIX82, -0.5);
          // LIBS.translateY(MODEL_MATRIX82, 2*Math.sin(booCounter));

          // MODEL_MATRIX83 = LIBS.get_I4();
          // LIBS.translateY(MODEL_MATRIX83, 0.5);
          // LIBS.translateZ(MODEL_MATRIX83, 0.9);  
          // LIBS.translateX(MODEL_MATRIX83, 0.3);
          // LIBS.rotateY(MODEL_MATRIX83, -2.5);
          // LIBS.rotateZ(MODEL_MATRIX83, 0.5);
          // LIBS.translateY(MODEL_MATRIX83, 2*Math.sin(booCounter));

          BOO_MOUTH_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(BOO_MOUTH_MODEL_MATRIX, 0.7);
          LIBS.translateY(BOO_MOUTH_MODEL_MATRIX, -0.45);
          LIBS.translateY(BOO_MOUTH_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_BROW_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(BOO_BROW_MODEL_MATRIX, 0.5);
          LIBS.translateZ(BOO_BROW_MODEL_MATRIX, -0.05); 
          LIBS.translateX(BOO_BROW_MODEL_MATRIX, -0.22);
          LIBS.translateY(BOO_BROW_MODEL_MATRIX, 2*Math.sin(booCounter));

          BOO_BROW2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(BOO_BROW2_MODEL_MATRIX, 0.5);
          LIBS.translateZ(BOO_BROW2_MODEL_MATRIX, -0.05);  
          LIBS.translateX(BOO_BROW2_MODEL_MATRIX, 0.22);
          LIBS.translateY(BOO_BROW2_MODEL_MATRIX, 2*Math.sin(booCounter));


          LIBS.translateX(MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_FEET_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_FEET2_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_EYES_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_EYES2_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_PUPIL_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_PUPIL2_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_TEETH_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_TEETH2_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_MOUTH_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_BROW_MODEL_MATRIX, 4);
          LIBS.translateX(GOOMBA_BROW2_MODEL_MATRIX, 4);
          LIBS.translateY(MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_FEET_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_FEET2_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_EYES_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_EYES2_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_PUPIL_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_PUPIL2_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_TEETH_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_TEETH2_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_MOUTH_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_BROW_MODEL_MATRIX, -0.8);
          LIBS.translateY(GOOMBA_BROW2_MODEL_MATRIX, -0.8);

          if (walkFront == false) {
            LIBS.translateX(GOOMBA_EYES_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_EYES2_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_PUPIL_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_PUPIL2_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_TEETH_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_TEETH2_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_MOUTH_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_BROW_MODEL_MATRIX, -2*4);
            LIBS.translateX(GOOMBA_BROW2_MODEL_MATRIX, -2*4);
          }

          LIBS.translateX(POKIO_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_FEET_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_FEET2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_EYES_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_EYES2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_TAIL_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_BEAK_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_RED_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_RED2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_NAIL_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_NAIL2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_NAIL3_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_NAIL4_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_HAT_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_OUTER_HAT_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_TOP_HAT_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_WING_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_WING2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_OUTER_WING_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_OUTER_WING2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_WING_CURVE_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_WING_CURVE2_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_BROW_MODEL_MATRIX, -4);
          LIBS.translateX(POKIO_BROW2_MODEL_MATRIX, -4);

          if (walkFrontpokio == false) {
            LIBS.translateX(POKIO_WING_CURVE_MODEL_MATRIX, 8);
            LIBS.translateX(POKIO_WING_CURVE2_MODEL_MATRIX, 8);
            LIBS.translateX(POKIO_BROW_MODEL_MATRIX, 8);
            LIBS.translateX(POKIO_BROW2_MODEL_MATRIX, 8);
          }

          LIBS.translateY(POKIO_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_FEET_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_FEET2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_EYES_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_EYES2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_TAIL_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_BEAK_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_RED_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_RED2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_NAIL_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_NAIL2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_NAIL3_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_NAIL4_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_HAT_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_OUTER_HAT_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_TOP_HAT_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_WING_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_WING2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_OUTER_WING_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_OUTER_WING2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_WING_CURVE_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_WING_CURVE2_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_BROW_MODEL_MATRIX, -1.3);
          LIBS.translateY(POKIO_BROW2_MODEL_MATRIX, -1.3);

          LIBS.translateX(BOO_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_EYES_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_EYES2_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_CROWN_HAT_MODEL_MATRIX, -6); 
          LIBS.translateX(BOO_PUPIL_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_TEETH_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_TEETH2_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_PUPIL2_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_HAND_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_HAND2_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_TAIL_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_CROWN_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_CROWN2_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_CROWN3_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_TONGUE_MODEL_MATRIX, -6);
          // LIBS.translateX(MODEL_MATRIX82, -6);
          // LIBS.translateX(MODEL_MATRIX83, -6);
          LIBS.translateX(BOO_MOUTH_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_BROW_MODEL_MATRIX, -6);
          LIBS.translateX(BOO_BROW2_MODEL_MATRIX, -6);

          LIBS.translateY(BOO_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_EYES_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_EYES2_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_CROWN_HAT_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_PUPIL_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_TEETH_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_TEETH2_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_PUPIL2_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_HAND_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_HAND2_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_TAIL_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_CROWN_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_CROWN2_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_CROWN3_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_TONGUE_MODEL_MATRIX, 3.3);
          // LIBS.translateY(MODEL_MATRIX82, 3.3);
          // LIBS.translateY(MODEL_MATRIX83, 3.3);
          LIBS.translateY(BOO_MOUTH_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_BROW_MODEL_MATRIX, 3.3);
          LIBS.translateY(BOO_BROW2_MODEL_MATRIX, 3.3);

          LIBS.translateZ(BOO_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_EYES_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_EYES2_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_CROWN_HAT_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_PUPIL_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_TEETH_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_TEETH2_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_PUPIL2_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_HAND_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_HAND2_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_TAIL_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_CROWN_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_CROWN2_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_CROWN3_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_TONGUE_MODEL_MATRIX, 10);
          // LIBS.translateZ(MODEL_MATRIX82, 10);
          // LIBS.translateZ(MODEL_MATRIX83, 10);
          LIBS.translateZ(BOO_MOUTH_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_BROW_MODEL_MATRIX, 10);
          LIBS.translateZ(BOO_BROW2_MODEL_MATRIX, 10);
          

          if (walkFrontpokio == false) {
            // LIBS.translateX(POKIO_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_FEET_MODEL_MATRIX, 0.7);
            LIBS.translateX(POKIO_FEET2_MODEL_MATRIX, -0.7);
            LIBS.translateX(POKIO_EYES_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_EYES2_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_TAIL_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_BEAK_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_RED_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_RED2_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_NAIL_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_NAIL2_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_NAIL3_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_NAIL4_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_WING_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_WING2_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_OUTER_WING_MODEL_MATRIX, 2*4);
            LIBS.translateX(POKIO_OUTER_WING2_MODEL_MATRIX, 2*4);
          }

          GROUND_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateY(GROUND_MODEL_MATRIX, -3.2);
          LIBS.translateX(GROUND_MODEL_MATRIX, 0);
          LIBS.translateZ(GROUND_MODEL_MATRIX, 0);

          if (leafGrow == true) {
            leafReverse += leafGrowSpeed;
            if (leafReverse >= 0.5) {
              leafGrow = false;
            }
          } 
          else {
            leafReverse -= leafGrowSpeed;
            if (leafReverse <= 0) {
              leafGrow = true;
            }
          }

          if (leafGrow2 == true) {
            leafReverse2 += leafGrowSpeed2;
            if (leafReverse2 >= 0.5) {
              leafGrow2 = false;
            }
          } 
          else {
            leafReverse2 -= leafGrowSpeed2;
            if (leafReverse2 <= 0) {
              leafGrow2 = true;
            }
          }

          LOG_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(LOG_MODEL_MATRIX, -15);
          LIBS.translateY(LOG_MODEL_MATRIX, -3.2);
          LIBS.scale(LOG_MODEL_MATRIX, 3, 3, 3);

          LEAF_LOWER_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(LEAF_LOWER_MODEL_MATRIX, -15);
          LIBS.translateY(LEAF_LOWER_MODEL_MATRIX, 0);
          LIBS.scale(LEAF_LOWER_MODEL_MATRIX, 3+leafReverse, 3, 3+leafReverse);
          
          LEAF_UPPER_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(LEAF_UPPER_MODEL_MATRIX, -15);
          LIBS.translateY(LEAF_UPPER_MODEL_MATRIX, 5);
          LIBS.scale(LEAF_UPPER_MODEL_MATRIX, 3+leafReverse2, 3, 3+leafReverse2);

          LOG2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(LOG2_MODEL_MATRIX, 6);
          LIBS.translateZ(LOG2_MODEL_MATRIX, -15);
          LIBS.translateY(LOG2_MODEL_MATRIX, -3.2);
          LIBS.scale(LOG2_MODEL_MATRIX, 1.5, 1.5, 1.5);

          LEAF_LOWER2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(LEAF_LOWER2_MODEL_MATRIX, 6);
          LIBS.translateZ(LEAF_LOWER2_MODEL_MATRIX, -15);
          LIBS.translateY(LEAF_LOWER2_MODEL_MATRIX, -0.8);
          LIBS.scale(LEAF_LOWER2_MODEL_MATRIX, 1.5+leafReverse, 1.5, 1.5+leafReverse);
          
          LEAF_UPPER2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(LEAF_UPPER2_MODEL_MATRIX, 6);
          LIBS.translateZ(LEAF_UPPER2_MODEL_MATRIX, -15);
          LIBS.translateY(LEAF_UPPER2_MODEL_MATRIX, 2.6);
          LIBS.scale(LEAF_UPPER2_MODEL_MATRIX, 1.5+leafReverse2, 1.5, 1.5+leafReverse2);

          LOG3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(LOG3_MODEL_MATRIX, -6);
          LIBS.translateZ(LOG3_MODEL_MATRIX, -15);
          LIBS.translateY(LOG3_MODEL_MATRIX, -3.2);
          LIBS.scale(LOG3_MODEL_MATRIX, 2, 2, 2);

          LEAF_LOWER3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(LEAF_LOWER3_MODEL_MATRIX, -6);
          LIBS.translateZ(LEAF_LOWER3_MODEL_MATRIX, -15);
          LIBS.translateY(LEAF_LOWER3_MODEL_MATRIX, -0.5);
          LIBS.scale(LEAF_LOWER3_MODEL_MATRIX, 2+leafReverse2, 2, 2+leafReverse2);
          
          LEAF_UPPER3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateX(LEAF_UPPER3_MODEL_MATRIX, -6);
          LIBS.translateZ(LEAF_UPPER3_MODEL_MATRIX, -15);
          LIBS.translateY(LEAF_UPPER3_MODEL_MATRIX, 3);
          LIBS.scale(LEAF_UPPER3_MODEL_MATRIX, 2+leafReverse, 2, 2+leafReverse);

          CASTLE_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTLE_MODEL_MATRIX, 0);
          LIBS.translateY(CASTLE_MODEL_MATRIX, 2);
          LIBS.translateX(CASTLE_MODEL_MATRIX , 13);
          LIBS.scale(CASTLE_MODEL_MATRIX, 4, 5, 8);

          CASTLE_OUTER_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTLE_OUTER_MODEL_MATRIX, 8);
          LIBS.translateY(CASTLE_OUTER_MODEL_MATRIX, -3);
          LIBS.translateX(CASTLE_OUTER_MODEL_MATRIX , 9);
          LIBS.scale(CASTLE_OUTER_MODEL_MATRIX, 3, 4, 3);

          CASTLE_OUTER2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTLE_OUTER2_MODEL_MATRIX, -8);
          LIBS.translateY(CASTLE_OUTER2_MODEL_MATRIX, -3);
          LIBS.translateX(CASTLE_OUTER2_MODEL_MATRIX , 9);
          LIBS.scale(CASTLE_OUTER2_MODEL_MATRIX, 3, 4, 3);

          CASTILE_OUTER3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTILE_OUTER3_MODEL_MATRIX, 8);
          LIBS.translateY(CASTILE_OUTER3_MODEL_MATRIX, -3);
          LIBS.translateX(CASTILE_OUTER3_MODEL_MATRIX , 17);
          LIBS.scale(CASTILE_OUTER3_MODEL_MATRIX, 3, 4, 3);

          CASTLE_OUTER4_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTLE_OUTER4_MODEL_MATRIX, -8);
          LIBS.translateY(CASTLE_OUTER4_MODEL_MATRIX, -3);
          LIBS.translateX(CASTLE_OUTER4_MODEL_MATRIX , 17);
          LIBS.scale(CASTLE_OUTER4_MODEL_MATRIX, 3, 4, 3);

          CASTLE_OUTER5_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTLE_OUTER5_MODEL_MATRIX, 0);
          LIBS.translateY(CASTLE_OUTER5_MODEL_MATRIX, 7);
          LIBS.translateX(CASTLE_OUTER5_MODEL_MATRIX , 13);
          LIBS.scale(CASTLE_OUTER5_MODEL_MATRIX, 8, 2, 12);

          ROAD_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROAD_MODEL_MATRIX, 0);
          LIBS.translateY(ROAD_MODEL_MATRIX, -3);
          LIBS.translateX(ROAD_MODEL_MATRIX , 0);
          LIBS.scale(ROAD_MODEL_MATRIX, 18, 0.1, 7);

          OUTER_ROAD_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(OUTER_ROAD_MODEL_MATRIX, -6);
          LIBS.translateY(OUTER_ROAD_MODEL_MATRIX, -3);
          LIBS.translateX(OUTER_ROAD_MODEL_MATRIX , 0);
          LIBS.scale(OUTER_ROAD_MODEL_MATRIX, 5, 8, 5);

          OUTER_ROAD2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(OUTER_ROAD2_MODEL_MATRIX, -6);
          LIBS.translateY(OUTER_ROAD2_MODEL_MATRIX, -3);
          LIBS.translateX(OUTER_ROAD2_MODEL_MATRIX , -9);
          LIBS.scale(OUTER_ROAD2_MODEL_MATRIX, 5, 8, 5);

          OUTER_ROAD3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(OUTER_ROAD3_MODEL_MATRIX, -6);
          LIBS.translateY(OUTER_ROAD3_MODEL_MATRIX, -3);
          LIBS.translateX(OUTER_ROAD3_MODEL_MATRIX , -17);
          LIBS.scale(OUTER_ROAD3_MODEL_MATRIX, 5, 8, 5);

          OUTER_ROAD4_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(OUTER_ROAD4_MODEL_MATRIX, 6);
          LIBS.translateY(OUTER_ROAD4_MODEL_MATRIX, -3);
          LIBS.translateX(OUTER_ROAD4_MODEL_MATRIX , 0);
          LIBS.scale(OUTER_ROAD4_MODEL_MATRIX, 5, 8, 5);

          OUTER_ROAD5_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(OUTER_ROAD5_MODEL_MATRIX, 6);
          LIBS.translateY(OUTER_ROAD5_MODEL_MATRIX, -3);
          LIBS.translateX(OUTER_ROAD5_MODEL_MATRIX , -9);
          LIBS.scale(OUTER_ROAD5_MODEL_MATRIX, 5, 8, 5);

          OUTER_ROAD6_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(OUTER_ROAD6_MODEL_MATRIX, 6);
          LIBS.translateY(OUTER_ROAD6_MODEL_MATRIX, -3);
          LIBS.translateX(OUTER_ROAD6_MODEL_MATRIX , -17);
          LIBS.scale(OUTER_ROAD6_MODEL_MATRIX, 5, 8, 5);

          ROOTS1_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS1_MODEL_MATRIX, 15);
          LIBS.translateY(ROOTS1_MODEL_MATRIX, -3);
          LIBS.translateX(ROOTS1_MODEL_MATRIX , 0);
          LIBS.rotateZ(ROOTS1_MODEL_MATRIX , 0.5);
          LIBS.scale(ROOTS1_MODEL_MATRIX, 1, 4, 1);

          ROOTS2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS2_MODEL_MATRIX, 15);
          LIBS.translateY(ROOTS2_MODEL_MATRIX, -2);
          LIBS.translateX(ROOTS2_MODEL_MATRIX , -0.5);
          LIBS.rotateZ(ROOTS2_MODEL_MATRIX , -0.7);
          LIBS.scale(ROOTS2_MODEL_MATRIX, 0.5, 2, 0.5);


          ROOTS3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS3_MODEL_MATRIX, 10);
          LIBS.translateY(ROOTS3_MODEL_MATRIX, -3);
          LIBS.translateX(ROOTS3_MODEL_MATRIX , -10);
          LIBS.rotateZ(ROOTS3_MODEL_MATRIX , -0.5);
          LIBS.scale(ROOTS3_MODEL_MATRIX, 1, 4, 1);

          ROOTS4_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS4_MODEL_MATRIX, 10);
          LIBS.translateY(ROOTS4_MODEL_MATRIX, -2);
          LIBS.translateX(ROOTS4_MODEL_MATRIX , -9.5);
          LIBS.rotateZ(ROOTS4_MODEL_MATRIX , 0.7);
          LIBS.scale(ROOTS4_MODEL_MATRIX, 0.5, 3, 0.5);

          ROOTS5_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS5_MODEL_MATRIX, 10);
          LIBS.translateY(ROOTS5_MODEL_MATRIX, -3);
          LIBS.translateX(ROOTS5_MODEL_MATRIX , 1);
          LIBS.rotateZ(ROOTS5_MODEL_MATRIX , -0.5);
          LIBS.scale(ROOTS5_MODEL_MATRIX, 1, 4, 1);

          ROOTS6_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS6_MODEL_MATRIX, 10);
          LIBS.translateY(ROOTS6_MODEL_MATRIX, -2);
          LIBS.translateX(ROOTS6_MODEL_MATRIX , 1.5);
          LIBS.rotateZ(ROOTS6_MODEL_MATRIX , 0.7);
          LIBS.scale(ROOTS6_MODEL_MATRIX, 0.5, 3, 0.5);

          ROOTS7_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS7_MODEL_MATRIX, -10.5);
          LIBS.translateY(ROOTS7_MODEL_MATRIX, -2);
          LIBS.translateX(ROOTS7_MODEL_MATRIX , -12.5);
          LIBS.rotateX(ROOTS7_MODEL_MATRIX , 0.7);
          LIBS.scale(ROOTS7_MODEL_MATRIX, 0.5, 3, 0.5);

          ROOTS8_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROOTS8_MODEL_MATRIX, -10);
          LIBS.translateY(ROOTS8_MODEL_MATRIX, -3);
          LIBS.translateX(ROOTS8_MODEL_MATRIX , -12.5);
          LIBS.rotateX(ROOTS8_MODEL_MATRIX , -0.5);
          LIBS.scale(ROOTS8_MODEL_MATRIX, 1, 4, 1);

          ROCKS_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROCKS_MODEL_MATRIX, -10);
          LIBS.translateY(ROCKS_MODEL_MATRIX, -2.7);
          LIBS.translateX(ROCKS_MODEL_MATRIX , -11.5);
          LIBS.scale(ROCKS_MODEL_MATRIX, 1, 0.5, 1);

          ROCKS2_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROCKS2_MODEL_MATRIX, -10);
          LIBS.translateY(ROCKS2_MODEL_MATRIX, -2.7);
          LIBS.translateX(ROCKS2_MODEL_MATRIX , 1.5);
          LIBS.scale(ROCKS2_MODEL_MATRIX, 1, 0.5, 2);
          LIBS.rotateY(ROCKS2_MODEL_MATRIX , 0.8);

          ROCKS3_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROCKS3_MODEL_MATRIX, 15);
          LIBS.translateY(ROCKS3_MODEL_MATRIX, -2.7);
          LIBS.translateX(ROCKS3_MODEL_MATRIX , 0.5);
          LIBS.scale(ROCKS3_MODEL_MATRIX, 1, 0.5, 1.5);
          LIBS.rotateY(ROCKS3_MODEL_MATRIX , 0.3);
          LIBS.rotateZ(ROCKS3_MODEL_MATRIX , -0.3);

          ROCKS4_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROCKS4_MODEL_MATRIX, 10);
          LIBS.translateY(ROCKS4_MODEL_MATRIX, -2.7);
          LIBS.translateX(ROCKS4_MODEL_MATRIX , -1.5);
          LIBS.scale(ROCKS4_MODEL_MATRIX, 1, 0.5, 1);
          LIBS.rotateY(ROCKS4_MODEL_MATRIX , 0.8);

          ROCKS5_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROCKS5_MODEL_MATRIX, 10);
          LIBS.translateY(ROCKS5_MODEL_MATRIX, -2.7);
          LIBS.translateX(ROCKS5_MODEL_MATRIX , -11.5);
          LIBS.scale(ROCKS5_MODEL_MATRIX, 1, 0.5, 2);
          LIBS.rotateY(ROCKS5_MODEL_MATRIX , -0.8);

          ROCKS6_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(ROCKS6_MODEL_MATRIX, 14);
          LIBS.translateY(ROCKS6_MODEL_MATRIX, -2);
          LIBS.translateX(ROCKS6_MODEL_MATRIX , 11.5);
          LIBS.scale(ROCKS6_MODEL_MATRIX, 2, 2, 4);
          LIBS.rotateY(ROCKS5_MODEL_MATRIX , 3.5);


          CASTLE_DOOR_MODEL_MATRIX = LIBS.get_I4();
          LIBS.translateZ(CASTLE_DOOR_MODEL_MATRIX, 0);
          LIBS.translateY(CASTLE_DOOR_MODEL_MATRIX, -2);
          LIBS.translateX(CASTLE_DOOR_MODEL_MATRIX , 3.6);
          LIBS.rotateY(CASTLE_DOOR_MODEL_MATRIX , 1.6);
          LIBS.scale(CASTLE_DOOR_MODEL_MATRIX, 5, 5, 5);
          


          //putar pada sumbu

          temp = LIBS.get_I4();
          LIBS.translateX(temp, -goombaPos[0]);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -goombaPos[1]);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -goombaPos[2]);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);

          if (rotateBack1 == true) {
            goombaFeet1RotatePos -= goombaRotateSpeed;
            if (goombaFeet1RotatePos <= -0.35) {
              rotateBack1 = false;
            }
          }
          else {
            goombaFeet1RotatePos += goombaRotateSpeed;
            if (goombaFeet1RotatePos >= 0.35) {
              rotateBack1 = true;
            }
          }

          if (walkFront == false) {
            LIBS.rotateY(GOOMBA_FEET_MODEL_MATRIX, Math.PI);
          }
          
          temp = LIBS.get_I4();
          LIBS.rotateX(temp, goombaFeet1RotatePos);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, goombaPos[0]);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, goombaPos[1]);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, goombaPos[2]);
          GOOMBA_FEET_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, -goombaPos[0]);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -goombaPos[1]);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -goombaPos[2]);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);

          if (rotateBack2 == true) {
            goombaFeet2RotatePos -= goombaRotateSpeed;
            if (goombaFeet2RotatePos <= -0.35) {
              rotateBack2 = false;
            }
          }
          else {
            goombaFeet2RotatePos += goombaRotateSpeed;
            if (goombaFeet2RotatePos >= 0.35) {
              rotateBack2 = true;
            }
          }

          if (walkFront == false) {
            LIBS.rotateY(GOOMBA_FEET2_MODEL_MATRIX, Math.PI);
          }
          
          temp = LIBS.get_I4();
          LIBS.rotateX(temp, goombaFeet2RotatePos);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, -goombaPos[0]);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, goombaPos[1]);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, goombaPos[2]);
          GOOMBA_FEET2_MODEL_MATRIX = LIBS.multiply(GOOMBA_FEET2_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_EYES_MODEL_MATRIX = LIBS.multiply(GOOMBA_EYES_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_EYES_MODEL_MATRIX = LIBS.multiply(GOOMBA_EYES_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_EYES_MODEL_MATRIX = LIBS.multiply(GOOMBA_EYES_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_EYES2_MODEL_MATRIX = LIBS.multiply(GOOMBA_EYES2_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_EYES2_MODEL_MATRIX = LIBS.multiply(GOOMBA_EYES2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_EYES2_MODEL_MATRIX = LIBS.multiply(GOOMBA_EYES2_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_PUPIL_MODEL_MATRIX = LIBS.multiply(GOOMBA_PUPIL_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_PUPIL_MODEL_MATRIX = LIBS.multiply(GOOMBA_PUPIL_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_PUPIL_MODEL_MATRIX = LIBS.multiply(GOOMBA_PUPIL_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_PUPIL2_MODEL_MATRIX = LIBS.multiply(GOOMBA_PUPIL2_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_PUPIL2_MODEL_MATRIX = LIBS.multiply(GOOMBA_PUPIL2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_PUPIL2_MODEL_MATRIX = LIBS.multiply(GOOMBA_PUPIL2_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_TEETH_MODEL_MATRIX = LIBS.multiply(GOOMBA_TEETH_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_TEETH_MODEL_MATRIX = LIBS.multiply(GOOMBA_TEETH_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_TEETH_MODEL_MATRIX = LIBS.multiply(GOOMBA_TEETH_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_TEETH2_MODEL_MATRIX = LIBS.multiply(GOOMBA_TEETH2_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_TEETH2_MODEL_MATRIX = LIBS.multiply(GOOMBA_TEETH2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_TEETH2_MODEL_MATRIX = LIBS.multiply(GOOMBA_TEETH2_MODEL_MATRIX, temp);

          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_MOUTH_MODEL_MATRIX = LIBS.multiply(GOOMBA_MOUTH_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_MOUTH_MODEL_MATRIX = LIBS.multiply(GOOMBA_MOUTH_MODEL_MATRIX, temp);
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_MOUTH_MODEL_MATRIX = LIBS.multiply(GOOMBA_MOUTH_MODEL_MATRIX, temp);

          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_BROW_MODEL_MATRIX = LIBS.multiply(GOOMBA_BROW_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_BROW_MODEL_MATRIX = LIBS.multiply(GOOMBA_BROW_MODEL_MATRIX, temp);
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_BROW_MODEL_MATRIX = LIBS.multiply(GOOMBA_BROW_MODEL_MATRIX, temp);

          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_BROW2_MODEL_MATRIX = LIBS.multiply(GOOMBA_BROW2_MODEL_MATRIX, temp);
          if (walkFront == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            GOOMBA_BROW2_MODEL_MATRIX = LIBS.multiply(GOOMBA_BROW2_MODEL_MATRIX, temp);
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          GOOMBA_BROW2_MODEL_MATRIX = LIBS.multiply(GOOMBA_BROW2_MODEL_MATRIX, temp);

          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -pokioPos[1]);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -pokioPos[2]);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);

          if (rotateBack1pokio == true) {
            pokioFeet1RotatePos -= pokioRotateSpeed;
            if (pokioFeet1RotatePos <= -0.35) {
              rotateBack1pokio = false;
            }
          }
          else {
            pokioFeet1RotatePos += pokioRotateSpeed;
            if (pokioFeet1RotatePos >= 0.35) {
              rotateBack1pokio = true;
            }
          }

          if (walkFrontpokio == false) {
            LIBS.rotateY(POKIO_FEET_MODEL_MATRIX, Math.PI);
          }
          
          temp = LIBS.get_I4();
          LIBS.rotateX(temp, pokioFeet1RotatePos);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, pokioPos[0]);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, pokioPos[1]);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, pokioPos[2]);
          POKIO_FEET_MODEL_MATRIX = LIBS.multiply(POKIO_FEET_MODEL_MATRIX, temp);

          




          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -pokioPos[1]);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -pokioPos[2]);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);

          if (rotateBack2pokio == true) {
            pokioFeet2RotatePos -= pokioRotateSpeed;
            if (pokioFeet2RotatePos <= -0.35) {
              rotateBack2pokio = false;
            }
          }
          else {
            pokioFeet2RotatePos += pokioRotateSpeed;
            if (pokioFeet2RotatePos >= 0.35) {
              rotateBack2pokio = true;
            }
          }

          if (walkFrontpokio == false) {
            LIBS.rotateY(POKIO_FEET2_MODEL_MATRIX, Math.PI);
          }
          
          temp = LIBS.get_I4();
          LIBS.rotateX(temp, pokioFeet2RotatePos);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, pokioPos[1]);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, pokioPos[2]);
          POKIO_FEET2_MODEL_MATRIX = LIBS.multiply(POKIO_FEET2_MODEL_MATRIX, temp);





          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_EYES_MODEL_MATRIX = LIBS.multiply(POKIO_EYES_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_EYES_MODEL_MATRIX = LIBS.multiply(POKIO_EYES_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_EYES_MODEL_MATRIX = LIBS.multiply(POKIO_EYES_MODEL_MATRIX, temp);





          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_EYES2_MODEL_MATRIX = LIBS.multiply(POKIO_EYES2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_EYES2_MODEL_MATRIX = LIBS.multiply(POKIO_EYES2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_EYES2_MODEL_MATRIX = LIBS.multiply(POKIO_EYES2_MODEL_MATRIX, temp);
         



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_TAIL_MODEL_MATRIX = LIBS.multiply(POKIO_TAIL_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_TAIL_MODEL_MATRIX = LIBS.multiply(POKIO_TAIL_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_TAIL_MODEL_MATRIX = LIBS.multiply(POKIO_TAIL_MODEL_MATRIX, temp);




          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_BEAK_MODEL_MATRIX = LIBS.multiply(POKIO_BEAK_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_BEAK_MODEL_MATRIX = LIBS.multiply(POKIO_BEAK_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_BEAK_MODEL_MATRIX = LIBS.multiply(POKIO_BEAK_MODEL_MATRIX, temp);




          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_RED_MODEL_MATRIX = LIBS.multiply(POKIO_RED_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_RED_MODEL_MATRIX = LIBS.multiply(POKIO_RED_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_RED_MODEL_MATRIX = LIBS.multiply(POKIO_RED_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_RED2_MODEL_MATRIX = LIBS.multiply(POKIO_RED2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_RED2_MODEL_MATRIX = LIBS.multiply(POKIO_RED2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_RED2_MODEL_MATRIX = LIBS.multiply(POKIO_RED2_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -pokioPos[1]);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -pokioPos[2]);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.rotateX(temp, pokioFeet1RotatePos);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, pokioPos[0]);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, pokioPos[1]);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, pokioPos[2]);
          POKIO_NAIL_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL_MODEL_MATRIX, temp);




          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -pokioPos[1]);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -pokioPos[2]);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.rotateX(temp, pokioFeet1RotatePos);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, pokioPos[0]);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, pokioPos[1]);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, pokioPos[2]);
          POKIO_NAIL2_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL2_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -pokioPos[1]);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -pokioPos[2]);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.rotateX(temp, pokioFeet2RotatePos);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, pokioPos[0]);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, pokioPos[1]);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, pokioPos[2]);
          POKIO_NAIL3_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL3_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.translateX(temp, -pokioPos[0]);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, -pokioPos[1]);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, -pokioPos[2]);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);


          temp = LIBS.get_I4();
          LIBS.rotateX(temp, pokioFeet2RotatePos);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateX(temp, pokioPos[0]);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateY(temp, pokioPos[1]);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);
          temp = LIBS.get_I4();
          LIBS.translateZ(temp, pokioPos[2]);
          POKIO_NAIL4_MODEL_MATRIX = LIBS.multiply(POKIO_NAIL4_MODEL_MATRIX, temp);





          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING_MODEL_MATRIX = LIBS.multiply(POKIO_WING_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_WING_MODEL_MATRIX = LIBS.multiply(POKIO_WING_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING_MODEL_MATRIX = LIBS.multiply(POKIO_WING_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING2_MODEL_MATRIX = LIBS.multiply(POKIO_WING2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_WING2_MODEL_MATRIX = LIBS.multiply(POKIO_WING2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING2_MODEL_MATRIX = LIBS.multiply(POKIO_WING2_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_OUTER_WING_MODEL_MATRIX = LIBS.multiply(POKIO_OUTER_WING_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_OUTER_WING_MODEL_MATRIX = LIBS.multiply(POKIO_OUTER_WING_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_OUTER_WING_MODEL_MATRIX = LIBS.multiply(POKIO_OUTER_WING_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_OUTER_WING2_MODEL_MATRIX = LIBS.multiply(POKIO_OUTER_WING2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_OUTER_WING2_MODEL_MATRIX = LIBS.multiply(POKIO_OUTER_WING2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_OUTER_WING2_MODEL_MATRIX = LIBS.multiply(POKIO_OUTER_WING2_MODEL_MATRIX, temp);

          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING_CURVE_MODEL_MATRIX = LIBS.multiply(POKIO_WING_CURVE_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_WING_CURVE_MODEL_MATRIX = LIBS.multiply(POKIO_WING_CURVE_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING_CURVE_MODEL_MATRIX = LIBS.multiply(POKIO_WING_CURVE_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING_CURVE2_MODEL_MATRIX = LIBS.multiply(POKIO_WING_CURVE2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_WING_CURVE2_MODEL_MATRIX = LIBS.multiply(POKIO_WING_CURVE2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_WING_CURVE2_MODEL_MATRIX = LIBS.multiply(POKIO_WING_CURVE2_MODEL_MATRIX, temp);



          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_BROW_MODEL_MATRIX = LIBS.multiply(POKIO_BROW_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_BROW_MODEL_MATRIX = LIBS.multiply(POKIO_BROW_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_BROW_MODEL_MATRIX = LIBS.multiply(POKIO_BROW_MODEL_MATRIX, temp);




          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_BROW2_MODEL_MATRIX = LIBS.multiply(POKIO_BROW2_MODEL_MATRIX, temp);
          if (walkFrontpokio == false) {
            temp = LIBS.get_I4();
            LIBS.rotateY(temp, Math.PI);
            POKIO_BROW2_MODEL_MATRIX = LIBS.multiply(POKIO_BROW2_MODEL_MATRIX, temp);
            
          }
          temp = LIBS.get_I4();
          LIBS.translateX(temp, 0);
          POKIO_BROW2_MODEL_MATRIX = LIBS.multiply(POKIO_BROW2_MODEL_MATRIX, temp);




          //render
          goomba.MODEL_MATRIX = MODEL_MATRIX;
          goomba.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaFeet1.MODEL_MATRIX = GOOMBA_FEET_MODEL_MATRIX;
          goombaFeet1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaFeet2.MODEL_MATRIX = GOOMBA_FEET2_MODEL_MATRIX;
          goombaFeet2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaEyes1.MODEL_MATRIX = GOOMBA_EYES_MODEL_MATRIX;
          goombaEyes1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaEyes2.MODEL_MATRIX = GOOMBA_EYES2_MODEL_MATRIX;
          goombaEyes2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaPupil1.MODEL_MATRIX = GOOMBA_PUPIL_MODEL_MATRIX;
          goombaPupil1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaPupil2.MODEL_MATRIX = GOOMBA_PUPIL2_MODEL_MATRIX;
          goombaPupil2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaTeeth1.MODEL_MATRIX = GOOMBA_TEETH_MODEL_MATRIX;
          goombaTeeth1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaTeeth2.MODEL_MATRIX = GOOMBA_TEETH2_MODEL_MATRIX;
          goombaTeeth2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaMouth.MODEL_MATRIX = GOOMBA_MOUTH_MODEL_MATRIX;
          goombaMouth.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaBrow1.MODEL_MATRIX = GOOMBA_BROW_MODEL_MATRIX;
          goombaBrow1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          goombaBrow2.MODEL_MATRIX = GOOMBA_BROW2_MODEL_MATRIX;
          goombaBrow2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokio.MODEL_MATRIX = POKIO_MODEL_MATRIX;
          pokio.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioFeet1.MODEL_MATRIX = POKIO_FEET_MODEL_MATRIX;
          pokioFeet1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioFeet2.MODEL_MATRIX = POKIO_FEET2_MODEL_MATRIX;
          pokioFeet2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioEyes1.MODEL_MATRIX = POKIO_EYES_MODEL_MATRIX;
          pokioEyes1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioEyes2.MODEL_MATRIX = POKIO_EYES2_MODEL_MATRIX;
          pokioEyes2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioTail1.MODEL_MATRIX = POKIO_TAIL_MODEL_MATRIX;
          pokioTail1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioBeak1.MODEL_MATRIX = POKIO_BEAK_MODEL_MATRIX;
          pokioBeak1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioRed1.MODEL_MATRIX = POKIO_RED_MODEL_MATRIX;
          pokioRed1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioRed2.MODEL_MATRIX = POKIO_RED2_MODEL_MATRIX;
          pokioRed2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioNail1.MODEL_MATRIX = POKIO_NAIL_MODEL_MATRIX;
          pokioNail1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioNail2.MODEL_MATRIX = POKIO_NAIL2_MODEL_MATRIX;
          pokioNail2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioNail3.MODEL_MATRIX = POKIO_NAIL3_MODEL_MATRIX;
          pokioNail3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioNail4.MODEL_MATRIX = POKIO_NAIL4_MODEL_MATRIX;
          pokioNail4.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioHat1.MODEL_MATRIX = POKIO_HAT_MODEL_MATRIX;
          pokioHat1.render(VIEW_MATRIX, PROJECTION_MATRIX);
          
          pokioOuterHat1.MODEL_MATRIX = POKIO_OUTER_HAT_MODEL_MATRIX;
          pokioOuterHat1.render(VIEW_MATRIX, PROJECTION_MATRIX);
          
          pokioTopHat1.MODEL_MATRIX = POKIO_TOP_HAT_MODEL_MATRIX;
          pokioTopHat1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioWing1.MODEL_MATRIX = POKIO_WING_MODEL_MATRIX;
          pokioWing1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioWing2.MODEL_MATRIX = POKIO_WING2_MODEL_MATRIX;
          pokioWing2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioOuterWing1.MODEL_MATRIX = POKIO_OUTER_WING_MODEL_MATRIX;
          pokioOuterWing1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioOuterWing2.MODEL_MATRIX = POKIO_OUTER_WING2_MODEL_MATRIX;
          pokioOuterWing2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioBrow1.MODEL_MATRIX = POKIO_BROW_MODEL_MATRIX;
          pokioBrow1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioBrow2.MODEL_MATRIX = POKIO_BROW2_MODEL_MATRIX;
          pokioBrow2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioWingCurve1.MODEL_MATRIX = POKIO_WING_CURVE_MODEL_MATRIX;
          pokioWingCurve1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          pokioWingCurve2.MODEL_MATRIX = POKIO_WING_CURVE2_MODEL_MATRIX;
          pokioWingCurve2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          Boo.MODEL_MATRIX = BOO_MODEL_MATRIX;
          Boo.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooEyes1.MODEL_MATRIX = BOO_EYES_MODEL_MATRIX;
          BooEyes1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooEyes2.MODEL_MATRIX = BOO_EYES2_MODEL_MATRIX;
          BooEyes2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooCrownHat.MODEL_MATRIX = BOO_CROWN_HAT_MODEL_MATRIX;
          BooCrownHat.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooPupil1.MODEL_MATRIX = BOO_PUPIL_MODEL_MATRIX;
          BooPupil1.render(VIEW_MATRIX, PROJECTION_MATRIX);
          
          BooTeeth2.MODEL_MATRIX = BOO_TEETH_MODEL_MATRIX;
          BooTeeth2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooTeeth3.MODEL_MATRIX = BOO_TEETH2_MODEL_MATRIX;
          BooTeeth3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooPupil2.MODEL_MATRIX = BOO_PUPIL2_MODEL_MATRIX;
          BooPupil2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooHand1.MODEL_MATRIX = BOO_HAND_MODEL_MATRIX;
          BooHand1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooHand2.MODEL_MATRIX = BOO_HAND2_MODEL_MATRIX;
          BooHand2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooTail.MODEL_MATRIX = BOO_TAIL_MODEL_MATRIX;
          BooTail.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooCrown1.MODEL_MATRIX = BOO_CROWN_MODEL_MATRIX;
          BooCrown1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooCrown2.MODEL_MATRIX = BOO_CROWN2_MODEL_MATRIX;
          BooCrown2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooCrown3.MODEL_MATRIX = BOO_CROWN3_MODEL_MATRIX;
          BooCrown3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooTongue.MODEL_MATRIX = BOO_TONGUE_MODEL_MATRIX;
          BooTongue.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooBrow1.MODEL_MATRIX = BOO_BROW_MODEL_MATRIX;
          BooBrow1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooBrow2.MODEL_MATRIX = BOO_BROW2_MODEL_MATRIX;
          BooBrow2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          BooMouth.MODEL_MATRIX = BOO_MOUTH_MODEL_MATRIX;
          BooMouth.render(VIEW_MATRIX, PROJECTION_MATRIX);

          ground.MODEL_MATRIX = GROUND_MODEL_MATRIX;
          ground.render(VIEW_MATRIX, PROJECTION_MATRIX);
          
          log1.MODEL_MATRIX = LOG_MODEL_MATRIX;
          log1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          leafLower1.MODEL_MATRIX = LEAF_LOWER_MODEL_MATRIX;
          leafLower1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          leafUpper1.MODEL_MATRIX = LEAF_UPPER_MODEL_MATRIX;
          leafUpper1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          log2.MODEL_MATRIX = LOG2_MODEL_MATRIX;
          log2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          leafLower2.MODEL_MATRIX = LEAF_LOWER2_MODEL_MATRIX;
          leafLower2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          leafUpper2.MODEL_MATRIX = LEAF_UPPER2_MODEL_MATRIX;
          leafUpper2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          log3.MODEL_MATRIX = LOG3_MODEL_MATRIX;
          log3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          leafLower3.MODEL_MATRIX = LEAF_LOWER3_MODEL_MATRIX;
          leafLower3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          leafUpper3.MODEL_MATRIX = LEAF_UPPER3_MODEL_MATRIX;
          leafUpper3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castle.MODEL_MATRIX = CASTLE_MODEL_MATRIX;
          castle.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castleOuter1.MODEL_MATRIX = CASTLE_OUTER_MODEL_MATRIX;
          castleOuter1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castleOuter2.MODEL_MATRIX = CASTLE_OUTER2_MODEL_MATRIX;
          castleOuter2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castleOuter3.MODEL_MATRIX = CASTILE_OUTER3_MODEL_MATRIX;
          castleOuter3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castleOuter4.MODEL_MATRIX = CASTLE_OUTER4_MODEL_MATRIX;
          castleOuter4.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castleOuter5.MODEL_MATRIX = CASTLE_OUTER5_MODEL_MATRIX;
          castleOuter5.render(VIEW_MATRIX, PROJECTION_MATRIX);

          road.MODEL_MATRIX = ROAD_MODEL_MATRIX;
          road.render(VIEW_MATRIX, PROJECTION_MATRIX);

          outerRoad1.MODEL_MATRIX = OUTER_ROAD_MODEL_MATRIX;
          outerRoad1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          outerRoad2.MODEL_MATRIX = OUTER_ROAD2_MODEL_MATRIX;
          outerRoad2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          outerRoad3.MODEL_MATRIX = OUTER_ROAD3_MODEL_MATRIX;
          outerRoad3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          outerRoad4.MODEL_MATRIX = OUTER_ROAD4_MODEL_MATRIX;
          outerRoad4.render(VIEW_MATRIX, PROJECTION_MATRIX);

          outerRoad5.MODEL_MATRIX = OUTER_ROAD5_MODEL_MATRIX;
          outerRoad5.render(VIEW_MATRIX, PROJECTION_MATRIX);

          outerRoad6.MODEL_MATRIX = OUTER_ROAD6_MODEL_MATRIX;
          outerRoad6.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots1.MODEL_MATRIX = ROOTS1_MODEL_MATRIX;
          roots1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots2.MODEL_MATRIX = ROOTS2_MODEL_MATRIX;
          roots2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots3.MODEL_MATRIX = ROOTS3_MODEL_MATRIX;
          roots3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots4.MODEL_MATRIX = ROOTS4_MODEL_MATRIX;
          roots4.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots5.MODEL_MATRIX = ROOTS5_MODEL_MATRIX;
          roots5.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots6.MODEL_MATRIX = ROOTS6_MODEL_MATRIX;
          roots6.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots7.MODEL_MATRIX = ROOTS7_MODEL_MATRIX;
          roots7.render(VIEW_MATRIX, PROJECTION_MATRIX);

          roots8.MODEL_MATRIX = ROOTS8_MODEL_MATRIX;
          roots8.render(VIEW_MATRIX, PROJECTION_MATRIX);

          rocks1.MODEL_MATRIX = ROCKS_MODEL_MATRIX;
          rocks1.render(VIEW_MATRIX, PROJECTION_MATRIX);

          rocks2.MODEL_MATRIX = ROCKS2_MODEL_MATRIX;
          rocks2.render(VIEW_MATRIX, PROJECTION_MATRIX);

          rocks3.MODEL_MATRIX = ROCKS3_MODEL_MATRIX;
          rocks3.render(VIEW_MATRIX, PROJECTION_MATRIX);

          rocks4.MODEL_MATRIX = ROCKS4_MODEL_MATRIX;
          rocks4.render(VIEW_MATRIX, PROJECTION_MATRIX);

          rocks5.MODEL_MATRIX = ROCKS5_MODEL_MATRIX;
          rocks5.render(VIEW_MATRIX, PROJECTION_MATRIX);

          rocks6.MODEL_MATRIX = ROCKS6_MODEL_MATRIX;
          rocks6.render(VIEW_MATRIX, PROJECTION_MATRIX);

          castleDoor1.MODEL_MATRIX = CASTLE_DOOR_MODEL_MATRIX;
          castleDoor1.render(VIEW_MATRIX, PROJECTION_MATRIX);


          window.requestAnimationFrame(animate);
      };
 
      animate(0);
  }
  window.addEventListener('load',main);