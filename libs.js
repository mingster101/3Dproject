var LIBS = {

    degToRad: function(angle){
  
      return(angle*Math.PI/180);
  
    },
  
    multiply: function(mat1, mat2){
      var res = this.get_I4();
      var N = 4;
      let i, j, k;
      for (i = 0; i < N; i++){
        for (j = 0; j < N; j++){
          res[i*N + j] = 0;
          for (k = 0; k < N; k++)
            res[i*N + j] += mat1[i*N + k]*mat2[k*N + j];
        }
      }
      return res;
    },
  
    load_texture: function(image_URL){
      var texture = GL.createTexture();
  
      var image = new Image();
      image.src = image_URL;
      image.onload = function(e) {
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);
        GL.generateMipmap(GL.TEXTURE_2D);
        GL.bindTexture(GL.TEXTURE_2D, null);
      };
  
      return texture;
    },
  
    createCurve: function(controlPoints, degree, numSegments) {
      // Menghitung basis B-spline
  
      function generateBSplineBasis(degree, numSegments) {
        const knots = [];
        // Uniform knot vector (assuming uniform parameterization)
        for (let i = 0; i <= degree + numSegments; i++) {
          knots.push(i / (numSegments + degree));
        }
    
        const basis = [];
        // Initialize basis with empty arrays
        for (let i = 0; i <= degree; i++) {
          basis[i] = new Array(numSegments + degree + 1).fill(0);
        }
    
        // Basis functions for degree 0 (piecewise constants)
        for (let i = 0; i <= numSegments; i++) {
          basis[0][i] = 1;
        }
    
        // Recursive calculation for higher degrees
        for (let k = 1; k <= degree; k++) {
          for (let i = 0; i <= numSegments - k; i++) {
            const left = knots[i + k] - knots[i];
            const right = knots[i + k + 1] - knots[i + 1];
            const a1 = (basis[k - 1][i] * left) / (left + right);
            const a2 = (basis[k - 1][i + 1] * right) / (left + right);
            basis[k][i] = a1;
            basis[k][i + 1] = a2;
          }
        }
    
        return basis;
      }
  
      const basis = generateBSplineBasis(degree, numSegments);
    
      // Menghitung kurva
      const curvePoints = [];
      for (let i = 0; i < numSegments; i++) {
        const point = [0, 0, 0];
        for (let j = 0; j < degree + 1; j++) {
          point[0] += basis[j][i] * controlPoints[j][0];
          point[1] += basis[j][i] * controlPoints[j][1];
          point[2] += basis[j][i] * controlPoints[j][2];
        }
        curvePoints.push(point);
      }
    
      // Menghitung wajah
      const faces = [];
      for (let i = 0; i < numSegments - 1; i++) {
        faces.push([i, i + 1, i + 2]);
        faces.push([i + 2, i + 1, i]);
      }
    
      // Mengembalikan verteks dan wajah
      return {
        vertices: curvePoints,
        faces: faces,
      };
    },
  
    generateCircle: function(x,y,rad){
      var list = []
      for(var i=0;i<360;i++){
        var a = rad*Math.cos((i/180)*Math.PI) + x;
        var b = rad*Math.sin((i/180)*Math.PI) + y;
        list.push(a);
        list.push(b);
      }
      return list;
    },
  
    generateEllipsoidX: function(x, y, z, radius, segments) {
      var vertices = [];
      var colors = [];
    
      // var angleIncrement = (2 * Math.PI) / segments;
    
      var rainbowColors = [];
    
      for (var i = 0; i < 5; i++) {
        rainbowColors.push([Math.random(), Math.random(), Math.random()])
      }
    
      console.log(segments);
      for (var i = 0; i <= segments; i++) {
        var v = Math.PI * (-0.5 + i / segments);
        var cosV = Math.cos(v);
        var sinV = Math.sin(v);
    
        for (var j = 0; j <= segments; j++) {
          var u = 2 * Math.PI * (j / segments);
          var sinU = Math.sin(u);
          var cosU = Math.cos(u);
    
          var xCoord = cosV * cosU;
          var yCoord = cosV * sinU;
          var zCoord = sinV;
    
          var vertexX = 1.5*(x + radius * xCoord);
          var vertexY = (y + radius * yCoord);
          var vertexZ = z + radius * zCoord;
    
          vertices.push(vertexX, vertexY, vertexZ);
    
          var colorIndex = j % rainbowColors.length;
          colors = colors.concat(rainbowColors[colorIndex]);
        }
      }
    
      var faces = [];
      for (var i = 0; i < segments; i++) {
        for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
    
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
        }
      }
    
      return { vertices: vertices, colors: colors, faces: faces };
    },
  
    generateEllipsoidY: function(x, y, z, radius, segments) {
      var vertices = [];
      var colors = [];
    
      // var angleIncrement = (2 * Math.PI) / segments;
    
      var rainbowColors = [];
    
      for (var i = 0; i < 5; i++) {
        rainbowColors.push([Math.random(), Math.random(), Math.random()])
      }
    
      console.log(segments);
      for (var i = 0; i <= segments; i++) {
        var v = Math.PI * (-0.5 + i / segments);
        var cosV = Math.cos(v);
        var sinV = Math.sin(v);
    
        for (var j = 0; j <= segments; j++) {
          var u = 2 * Math.PI * (j / segments);
          var sinU = Math.sin(u);
          var cosU = Math.cos(u);
    
          var xCoord = cosV * cosU;
          var yCoord = cosV * sinU;
          var zCoord = sinV;
    
          var vertexX = x + radius * xCoord;
          var vertexY = 1.5*(y + radius * yCoord);
          var vertexZ = z + radius * zCoord;
    
          vertices.push(vertexX, vertexY, vertexZ);
    
          var colorIndex = j % rainbowColors.length;
          colors = colors.concat(rainbowColors[colorIndex]);
        }
      }
    
      var faces = [];
      for (var i = 0; i < segments; i++) {
        for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
    
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
        }
      }
    
      return { vertices: vertices, colors: colors, faces: faces };
    },
  
    generateEllipsoidZ: function(x, y, z, radius, segments) {
      var vertices = [];
      var colors = [];
    
      // var angleIncrement = (2 * Math.PI) / segments;
    
      var rainbowColors = [];
    
      for (var i = 0; i < 5; i++) {
        rainbowColors.push([Math.random(), Math.random(), Math.random()])
      }
    
      console.log(segments);
      for (var i = 0; i <= segments; i++) {
        var v = Math.PI * (-0.5 + i / segments);
        var cosV = Math.cos(v);
        var sinV = Math.sin(v);
    
        for (var j = 0; j <= segments; j++) {
          var u = 2 * Math.PI * (j / segments);
          var sinU = Math.sin(u);
          var cosU = Math.cos(u);
    
          var xCoord = cosV * cosU;
          var yCoord = cosV * sinU;
          var zCoord = sinV;
    
          var vertexX = x + radius * xCoord;
          var vertexY = (y + radius * yCoord);
          var vertexZ = 1.5*(z + radius * zCoord);
    
          vertices.push(vertexX, vertexY, vertexZ);
    
          var colorIndex = j % rainbowColors.length;
          colors = colors.concat(rainbowColors[colorIndex]);
        }
      }
    
      var faces = [];
      for (var i = 0; i < segments; i++) {
        for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
    
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
        }
      }
    
      return { vertices: vertices, colors: colors, faces: faces };
    },
  
    generateSphere: function(x, y, z, radius, segments) {
      var vertices = [];
      var colors = [];
    
      var rainbowColors = [
        [0.0, 0.0, 1.0],
        [0.0, 0.0, 0.8]
      ];
    
      for (var i = 0; i <= segments; i++) {
        var latAngle = Math.PI * (-0.5 + (i / segments));
        var sinLat = Math.sin(latAngle);
        var cosLat = Math.cos(latAngle);
    
        for (var j = 0; j <= segments; j++) {
          var lonAngle = 2 * Math.PI * (j / segments);
          var sinLon = Math.sin(lonAngle);
          var cosLon = Math.cos(lonAngle);
    
          var xCoord = cosLon * cosLat;
          var yCoord = sinLon * cosLat;
          var zCoord = sinLat;
    
          var vertexX = x + radius * xCoord;
          var vertexY = y + radius * yCoord;
          var vertexZ = z + radius * zCoord;
    
          vertices.push(vertexX, vertexY, vertexZ);
    
          var colorIndex = j % rainbowColors.length;
          colors = colors.concat(rainbowColors[colorIndex]);
        }
      }
    
      var faces = [];
      for (var i = 0; i < segments; i++) {
        for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
    
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
        }
      }
    
      return { vertices: vertices, colors: colors, faces: faces };
      },
  
      generateCone: function(x, y, z, radius, height, segments) {
      var vertices = [];
      var colors = [];
  
      var rainbowColors = [];
  
      for (var i = 0; i < segments; i++) {
        rainbowColors.push([Math.random(), Math.random(), Math.random()])
      }
  
      var topVertex = [x, y + height, z];
      vertices.push(...topVertex);
  
      for (var i = 0; i <= segments; i++) {
        var angle = (i / segments) * 2 * Math.PI;
        var xCoord = x + radius * Math.cos(angle);
        var yCoord = y;
        var zCoord = z + radius * Math.sin(angle);
  
        var vertex = [xCoord, yCoord, zCoord];
        vertices.push(...vertex);
  
        var colorIndex = i % rainbowColors.length;
        colors.push(...rainbowColors[colorIndex]);
      }
  
      var faces = [];
      for (var i = 1; i <= segments; i++) {
        faces.push(0, i, i + 1);
      }
  
      return { vertices: vertices, colors: colors, faces: faces };
      },
  
      generateSpherePokio: function(x, y, z, radius, segments) {
        var vertices = [];
        var colors = [];
      
        var rainbowColors = [
          [0.0, 0.0, 1.0],
          [0.0, 0.0, 0.8]
        ];
      
        for (var i = 0; i <= segments; i++) {
          var latAngle = Math.PI * (-0.5 + (i / segments));
          var sinLat = Math.sin(latAngle);
          var cosLat = Math.cos(latAngle);
      
          for (var j = 0; j <= segments; j++) {
            var lonAngle = 2 * Math.PI * (j / segments);
            var sinLon = Math.sin(lonAngle);
            var cosLon = Math.cos(lonAngle);
      
            var xCoord = cosLon * cosLat;
            var yCoord = sinLon * cosLat;
            var zCoord = sinLat;
      
            var vertexX = x + radius * xCoord;
            var vertexY = y + radius * yCoord;
            var vertexZ = z + radius * zCoord;
      
            vertices.push(vertexX, vertexY, vertexZ);
      
            var colorIndex = j % rainbowColors.length;
            colors = colors.concat(rainbowColors[colorIndex]);
          }
        }
      
        var faces = [];
        for (var i = 0; i < segments; i++) {
          for (var j = 0; j < segments; j++) {
            var index = i * (segments + 1) + j;
            var nextIndex = index + segments + 1;
      
            faces.push(index, nextIndex, index + 1);
            faces.push(nextIndex, nextIndex + 1, index + 1);
          }
        }
      
        return { vertices: vertices, colors: colors, faces: faces };
        },
  
        generateSphereHatPokio: function(x, y, z, radius, segments) {
          var vertices = [];
          var colors = [];
        
          var rainbowColors = [
            [0.0, 0.0, 1.0],
            [0.0, 0.0, 0.8]
          ];
        
          for (var i = 0; i <= segments; i++) {
            var latAngle = Math.PI * (-0.5 + (i / segments));
            var sinLat = Math.sin(latAngle);
            var cosLat = Math.cos(latAngle);
        
            for (var j = 0; j <= segments; j++) {
              var lonAngle = 2 * Math.PI * (j / segments);
              var sinLon = Math.sin(lonAngle);
              var cosLon = Math.cos(lonAngle);
        
              var xCoord = cosLon * cosLat * 0.1;
              var yCoord = sinLon * cosLat;
              var zCoord = sinLat;
        
              var vertexX = x + radius * xCoord;
              var vertexY = y + radius * yCoord;
              var vertexZ = z + radius * zCoord;
        
              vertices.push(vertexX, vertexY, vertexZ);
        
              var colorIndex = j % rainbowColors.length;
              colors = colors.concat(rainbowColors[colorIndex]);
            }
          }
        
          var faces = [];
          for (var i = 0; i < segments; i++) {
            for (var j = 0; j < segments; j++) {
              var index = i * (segments + 1) + j;
              var nextIndex = index + segments + 1;
        
              faces.push(index, nextIndex, index + 1);
              faces.push(nextIndex, nextIndex + 1, index + 1);
            }
          }
        
          return { vertices: vertices, colors: colors, faces: faces };
          },
  
        generateEllipsoidPokio: function(x, y, z, radius, segments) {
          var vertices = [];
          var colors = [];
        
          var rainbowColors = [
            [0.0, 0.0, 1.0],
            [0.0, 0.0, 0.8]
          ];
        
          for (var i = 0; i <= segments; i++) {
            var latAngle = Math.PI * (-0.5 + (i / segments));
            var sinLat = Math.sin(latAngle);
            var cosLat = Math.cos(latAngle);
        
            for (var j = 0; j <= segments; j++) {
              var lonAngle = 2 * Math.PI * (j / segments);
              var sinLon = Math.sin(lonAngle);
              var cosLon = Math.cos(lonAngle);
        
              var xCoord = cosLon * cosLat * 1.1;
              var yCoord = sinLon * cosLat;
              var zCoord = sinLat;
        
              var vertexX = x + radius * xCoord;
              var vertexY = y + radius * yCoord;
              var vertexZ = z + radius * zCoord;
        
              vertices.push(vertexX, vertexY, vertexZ);
        
              var colorIndex = j % rainbowColors.length;
              colors = colors.concat(rainbowColors[colorIndex]);
            }
          }
        
          var faces = [];
          for (var i = 0; i < segments; i++) {
            for (var j = 0; j < segments; j++) {
              var index = i * (segments + 1) + j;
              var nextIndex = index + segments + 1;
        
              faces.push(index, nextIndex, index + 1);
              faces.push(nextIndex, nextIndex + 1, index + 1);
            }
          }
        
          return { vertices: vertices, colors: colors, faces: faces };
          },
  
          generateEllipsoidWingsPokio: function(x, y, z, radius, segments) {
              var vertices = [];
              var colors = [];
            
              var rainbowColors = [
                [0.0, 0.0, 1.0],
                [0.0, 0.0, 0.8]
              ];
            
              for (var i = 0; i <= segments; i++) {
                var latAngle = Math.PI * (-0.5 + (i / segments));
                var sinLat = Math.sin(latAngle);
                var cosLat = Math.cos(latAngle);
            
                for (var j = 0; j <= segments; j++) {
                  var lonAngle = 2 * Math.PI * (j / segments);
                  var sinLon = Math.sin(lonAngle);
                  var cosLon = Math.cos(lonAngle);
            
                  var xCoord = cosLon * cosLat * 0.35;
                  var yCoord = sinLon * cosLat * 1.3;
                  var zCoord = sinLat;
            
                  var vertexX = x + radius * xCoord;
                  var vertexY = y + radius * yCoord;
                  var vertexZ = z + radius * zCoord;
            
                  vertices.push(vertexX, vertexY, vertexZ);
            
                  var colorIndex = j % rainbowColors.length;
                  colors = colors.concat(rainbowColors[colorIndex]);
                }
              }
            
              var faces = [];
              for (var i = 0; i < segments; i++) {
                for (var j = 0; j < segments; j++) {
                  var index = i * (segments + 1) + j;
                  var nextIndex = index + segments + 1;
            
                  faces.push(index, nextIndex, index + 1);
                  faces.push(nextIndex, nextIndex + 1, index + 1);
                }
              }
            
              return { vertices: vertices, colors: colors, faces: faces };
              },
  
          generateEllipsoidRedPokio: function(x, y, z, radius, segments) {
              var vertices = [];
              var colors = [];
            
              var rainbowColors = [
                [0.0, 0.0, 1.0],
                [0.0, 0.0, 0.8]
              ];
            
              for (var i = 0; i <= segments; i++) {
                var latAngle = Math.PI * (-0.5 + (i / segments));
                var sinLat = Math.sin(latAngle);
                var cosLat = Math.cos(latAngle);
            
                for (var j = 0; j <= segments; j++) {
                  var lonAngle = 2 * Math.PI * (j / segments);
                  var sinLon = Math.sin(lonAngle);
                  var cosLon = Math.cos(lonAngle);
            
                  var xCoord = cosLon * cosLat * 0.3;
                  var yCoord = sinLon * cosLat * 0.8;
                  var zCoord = sinLat;
            
                  var vertexX = x + radius * xCoord;
                  var vertexY = y + radius * yCoord;
                  var vertexZ = z + radius * zCoord;
            
                  vertices.push(vertexX, vertexY, vertexZ);
            
                  var colorIndex = j % rainbowColors.length;
                  colors = colors.concat(rainbowColors[colorIndex]);
                }
              }
            
              var faces = [];
              for (var i = 0; i < segments; i++) {
                for (var j = 0; j < segments; j++) {
                  var index = i * (segments + 1) + j;
                  var nextIndex = index + segments + 1;
            
                  faces.push(index, nextIndex, index + 1);
                  faces.push(nextIndex, nextIndex + 1, index + 1);
                }
              }
            
              return { vertices: vertices, colors: colors, faces: faces };
              },
  
  
          generateEllipsoidEyesPokio: function(x, y, z, radius, segments) {
              var vertices = [];
              var colors = [];
            
              var rainbowColors = [
                [0.0, 0.0, 1.0],
                [0.0, 0.0, 0.8]
              ];
            
              for (var i = 0; i <= segments; i++) {
                var latAngle = Math.PI * (-0.5 + (i / segments));
                var sinLat = Math.sin(latAngle);
                var cosLat = Math.cos(latAngle);
            
                for (var j = 0; j <= segments; j++) {
                  var lonAngle = 2 * Math.PI * (j / segments);
                  var sinLon = Math.sin(lonAngle);
                  var cosLon = Math.cos(lonAngle);
            
                  var xCoord = cosLon * cosLat;
                  var yCoord = sinLon * cosLat * 1.7;
                  var zCoord = sinLat;
            
                  var vertexX = x + radius * xCoord;
                  var vertexY = y + radius * yCoord;
                  var vertexZ = z + radius * zCoord;
            
                  vertices.push(vertexX, vertexY, vertexZ);
            
                  var colorIndex = j % rainbowColors.length;
                  colors = colors.concat(rainbowColors[colorIndex]);
                }
              }
            
              var faces = [];
              for (var i = 0; i < segments; i++) {
                for (var j = 0; j < segments; j++) {
                  var index = i * (segments + 1) + j;
                  var nextIndex = index + segments + 1;
            
                  faces.push(index, nextIndex, index + 1);
                  faces.push(nextIndex, nextIndex + 1, index + 1);
                }
              }
            
              return { vertices: vertices, colors: colors, faces: faces };
              },
    
        generateConePokio: function(x, y, z, radius, height, segments) {
        var vertices = [];
        var colors = [];
    
        var rainbowColors = [];
    
        for (var i = 0; i < segments; i++) {
          rainbowColors.push([Math.random(), Math.random(), Math.random()])
        }
    
        var topVertex = [x, y + height, z];
        vertices.push(...topVertex);
    
        for (var i = 0; i <= segments; i++) {
          var angle = (i / segments) * 2 * Math.PI;
          var xCoord = x + radius * Math.cos(angle);
          var yCoord = y;
          var zCoord = z + radius * Math.sin(angle);
    
          var vertex = [xCoord, yCoord, zCoord];
          vertices.push(...vertex);
    
          var colorIndex = i % rainbowColors.length;
          colors.push(...rainbowColors[colorIndex]);
        }
    
        var faces = [];
        for (var i = 1; i <= segments; i++) {
          faces.push(0, i, i + 1);
        }
    
        return { vertices: vertices, colors: colors, faces: faces };
        },
  
        generateConeWingPokio: function(x, y, z, radius, height, segments) {
          var vertices = [];
          var colors = [];
      
          var rainbowColors = [];
      
          for (var i = 0; i < segments; i++) {
            rainbowColors.push([Math.random(), Math.random(), Math.random()])
          }
      
          var topVertex = [x, y + height, z];
          vertices.push(...topVertex);
      
          for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * 2 * Math.PI;
            var xCoord = x + radius * Math.cos(angle);
            var yCoord = y;
            var zCoord = z + radius * Math.sin(angle) * 3;
      
            var vertex = [xCoord, yCoord, zCoord];
            vertices.push(...vertex);
      
            var colorIndex = i % rainbowColors.length;
            colors.push(...rainbowColors[colorIndex]);
          }
      
          var faces = [];
          for (var i = 1; i <= segments; i++) {
            faces.push(0, i, i + 1);
          }
      
          return { vertices: vertices, colors: colors, faces: faces };
          },
  
        generateConeHatPokio: function(x, y, z, radius, height, segments) {
          var vertices = [];
          var colors = [];
      
          var rainbowColors = [];
      
          for (var i = 0; i < segments; i++) {
            rainbowColors.push([Math.random(), Math.random(), Math.random()])
          }
      
          var topVertex = [x, y + height, z];
          vertices.push(...topVertex);
      
          for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * 2 * Math.PI;
            var xCoord = x + radius * Math.cos(angle) * 2;
            var yCoord = y * 0.1;
            var zCoord = z + radius * Math.sin(angle) * 2;
      
            var vertex = [xCoord, yCoord, zCoord];
            vertices.push(...vertex);
      
            var colorIndex = i % rainbowColors.length;
            colors.push(...rainbowColors[colorIndex]);
          }
      
          var faces = [];
          for (var i = 1; i <= segments; i++) {
            faces.push(0, i, i + 1);
          }
      
          return { vertices: vertices, colors: colors, faces: faces };
          },
        
    //generate elliptic paraboloid
      generateEllipticParaboloidPokio: function(x, y, z, radius, segments) {
        var vertices = [];
        var colors = [];
      
        // var angleIncrement = (2 * Math.PI) / segments;
      
        var rainbowColors = [];
      
        for (var i = 0; i < 5; i++) {
          rainbowColors.push([Math.random(), Math.random(), Math.random()])
        }
      
        console.log(segments);
        for (var i = 0; i <= segments; i++) {
          var v = Math.PI * (-0.5 + i / segments);
      
          for (var j = 0; j <= segments; j++) {
            var u = 2 * Math.PI * (j / segments);
            var sinU = Math.sin(u);
            var cosU = Math.cos(u);
      
            var xCoord = v * cosU * 0.8;
            var yCoord = v * sinU * 0.8;
            var zCoord = Math.pow(v,2) * 2;
      
            var vertexX = x + radius * xCoord;
            var vertexY = y + radius * yCoord;
            var vertexZ = z + radius * zCoord;
      
            vertices.push(vertexX, vertexY, vertexZ);
      
            var colorIndex = j % rainbowColors.length;
            colors = colors.concat(rainbowColors[colorIndex]);
          }
        }
      
        var faces = [];
        for (var i = 0; i < segments; i++) {
          for (var j = 0; j < segments; j++) {
            var index = i * (segments + 1) + j;
            var nextIndex = index + segments + 1;
      
            faces.push(index, nextIndex, index + 1);
            faces.push(nextIndex, nextIndex + 1, index + 1);
          }
        }
      
        return { vertices: vertices, colors: colors, faces: faces };
      },
  
      generateEllipticParaboloidHatPokio: function(x, y, z, radius, segments) {
          var vertices = [];
          var colors = [];
        
          // var angleIncrement = (2 * Math.PI) / segments;
        
          var rainbowColors = [];
        
          for (var i = 0; i < 5; i++) {
            rainbowColors.push([Math.random(), Math.random(), Math.random()])
          }
        
          console.log(segments);
          for (var i = 0; i <= segments; i++) {
            var v = Math.PI * (-0.5 + i / segments);
        
            for (var j = 0; j <= segments; j++) {
              var u = 2 * Math.PI * (j / segments);
              var sinU = Math.sin(u);
              var cosU = Math.cos(u);
        
              var xCoord = v * cosU;
              var yCoord = v * sinU;
              var zCoord = Math.pow(v,2) * 0.25;
        
              var vertexX = x + radius * xCoord;
              var vertexY = y + radius * yCoord;
              var vertexZ = z + radius * zCoord;
        
              vertices.push(vertexX, vertexY, vertexZ);
        
              var colorIndex = j % rainbowColors.length;
              colors = colors.concat(rainbowColors[colorIndex]);
            }
          }
        
          var faces = [];
          for (var i = 0; i < segments; i++) {
            for (var j = 0; j < segments; j++) {
              var index = i * (segments + 1) + j;
              var nextIndex = index + segments + 1;
        
              faces.push(index, nextIndex, index + 1);
              faces.push(nextIndex, nextIndex + 1, index + 1);
            }
          }
        
          return { vertices: vertices, colors: colors, faces: faces };
        },
  
  //generate elliptic paraboloid
    generateEllipticParaboloid: function(x, y, z, radius, segments) {
      var vertices = [];
      var colors = [];
    
      // var angleIncrement = (2 * Math.PI) / segments;
    
      var rainbowColors = [];
    
      for (var i = 0; i < 5; i++) {
        rainbowColors.push([Math.random(), Math.random(), Math.random()])
      }
    
      console.log(segments);
      for (var i = 0; i <= segments; i++) {
        var v = Math.PI * (-0.5 + i / segments);
    
        for (var j = 0; j <= segments; j++) {
          var u = 2 * Math.PI * (j / segments);
          var sinU = Math.sin(u);
          var cosU = Math.cos(u);
    
          var xCoord = v * cosU;
          var yCoord = v * sinU;
          var zCoord = Math.pow(v,2);
    
          var vertexX = x + radius * xCoord;
          var vertexY = y + radius * yCoord;
          var vertexZ = z + radius * zCoord;
    
          vertices.push(vertexX, vertexY, vertexZ);
    
          var colorIndex = j % rainbowColors.length;
          colors = colors.concat(rainbowColors[colorIndex]);
        }
      }
    
      var faces = [];
      for (var i = 0; i < segments; i++) {
        for (var j = 0; j < segments; j++) {
          var index = i * (segments + 1) + j;
          var nextIndex = index + segments + 1;
    
          faces.push(index, nextIndex, index + 1);
          faces.push(nextIndex, nextIndex + 1, index + 1);
        }
      }
    
      return { vertices: vertices, colors: colors, faces: faces };
    },
  
  
    generateBSpline: function(controlPoint, m, degree) {
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
  },
  
  
  
  
  buatKurva3D: function(bspline, radius) {
      const totalPoints = 100;
      const vertices = [];
      const indices = [];
      const splinePoints = bspline;
  
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
  },
  
  
    get_projection: function(angle, a, zMin, zMax) {
  
      var tan = Math.tan(LIBS.degToRad(0.5*angle)),
  
          A = -(zMax+zMin)/(zMax-zMin),
  
          B = (-2*zMax*zMin)/(zMax-zMin);
  
  
  
      return [
  
        0.5/tan, 0 ,   0, 0,
  
        0, 0.5*a/tan,  0, 0,
  
        0, 0,         A, -1,
  
        0, 0,         B, 0
  
      ];
  
    },
  
    get_I4: function() {
  
        return [1,0,0,0,
  
                0,1,0,0,
  
                0,0,1,0,
  
                0,0,0,1];
  
      },
  
      
        scale: function(m, sx, sy, sz) {
        m[0] *= sx
        m[1] *= sx
        m[2] *= sx
        m[4] *= sy
        m[5] *= sy
        m[6] *= sy
        m[8] *= sz
        m[9] *= sz
        m[10] *= sz
      
        return m
      },
      
  
      rotateX: function(m, angle) {
  
        var c = Math.cos(angle);
  
        var s = Math.sin(angle);
  
        var mv1=m[1], mv5=m[5], mv9=m[9];
  
        m[1]=m[1]*c-m[2]*s;
  
        m[5]=m[5]*c-m[6]*s;
  
        m[9]=m[9]*c-m[10]*s;
  
    
  
        m[2]=m[2]*c+mv1*s;
  
        m[6]=m[6]*c+mv5*s;
  
        m[10]=m[10]*c+mv9*s;
  
      },
  
  
      rotateY: function(m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0=m[0], mv4=m[4], mv8=m[8];
        m[0]=c*m[0]+s*m[2];
        m[4]=c*m[4]+s*m[6];
        m[8]=c*m[8]+s*m[10];
  
        m[2]=c*m[2]-s*mv0;
        m[6]=c*m[6]-s*mv4;
        m[10]=c*m[10]-s*mv8;
      },
  
    
  
      rotateZ: function(m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0=m[0], mv4=m[4], mv8=m[8];
  
        m[0]=c*m[0]-s*m[1];
        m[4]=c*m[4]-s*m[5];
        m[8]=c*m[8]-s*m[9];
  
    
        m[1]=c*m[1]+s*mv0;
        m[5]=c*m[5]+s*mv4;
        m[9]=c*m[9]+s*mv8;
      },
  
      translateZ: function(m, t){
        m[14]+=t;
      },
  
      translateX : function(m,t){
        m[12] +=t;
      },
  
      translateY: function(m,t){
        m[13] +=t;
      },
  
      setPosition: function(m, x, y, z){
        m[12]=x, m[13]=y, m[14]=z;
      }
  
  };