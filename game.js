// =================================================================
// FUTMESA OLÍMPICO 3D - JOGO DO LUCAS (VERSÃO 7.0 - ESTILO EA FC 26)
// - Torcida Hiper-Realista Estilo EA SPORTS FC 26
// - Torcedores Detalhados com Camisas do Brasil, Casacos, Bonés, Cachecóis e Bandeiras
// - Arquibancadas 360° Densas com Cadeiras de Estádio e Placas de LED Dinâmicas
// - Limite de 80 Toques, Câmera com Zoom e Jogabilidade Limpa
// =================================================================

// --- SISTEMA DE ÁUDIO SINTETIZADO ---
class SoundManager {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playKick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }
  playControl() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }
  playTableBounce() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(190, this.ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }
  playWhistle() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2500, t);
    osc.frequency.setValueAtTime(3000, t + 0.07);
    osc.frequency.setValueAtTime(2600, t + 0.14);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.32);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.32);
  }
  playPointCheer() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.24, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, t + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }
}

const sounds = new SoundManager();

// --- CONFIGURAÇÕES ---
const CONFIG = {
  tableLength: 4.75,
  tableWidth: 2.51,
  tableHeightCenter: 0.82,
  tableCurveDrop: 0.20,
  netHeight: 0.18,
  ballRadius: 0.11,
  gravity: 12.0,
  playerSpeed: 5.2,
  winningPoints: 11,
  maxTouches: 80
};

// --- MOTOR PRINCIPAL ---
class FutmesaGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.touches = 0;
    this.sideWithBall = 'player';
    this.scorePlayer = 0;
    this.scoreCpu = 0;
    this.roundOver = false;
    this.server = 'player';
    this.isWaitingServe = true;
    this.difficulty = 'amador';

    this.controlBufferedTime = 0;

    // Rastreamento
    this.lastHitter = 'player';
    this.tableBouncesThisTurn = 0;
    this.lastBouncedSide = null;

    // Câmera e Zoom
    this.keys = {};
    this.mouseLook = { yaw: 0, pitch: 0.12 };
    this.cameraZoom = 2.9;
    this.camCurrentPos = new THREE.Vector3(0, 2.1, 5.5);
    this.isPointerLocked = false;

    // Torcedores para animação EA FC
    this.crowdMembers = [];
    this.celebrationIntensity = 0;

    this.diffBadge = document.getElementById('current-diff-badge');

    this.initThree();
    this.buildOlympicGym();
    this.buildFC26Grandstands();
    this.buildUltraVisibleTable();
    this.buildRefereeNPC();
    this.buildBall();
    this.buildCharacters();
    this.setupEvents();

    this.resetRound('player');
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setDifficulty(level) {
    this.difficulty = level;
    if (level === 'amador') {
      this.diffBadge.innerText = 'MODO: AMADOR';
      this.diffBadge.className = 'difficulty-badge';
    } else {
      this.diffBadge.innerText = 'MODO: AVANÇADO';
      this.diffBadge.className = 'difficulty-badge advanced';
    }
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);
    this.scene.fog = new THREE.FogExp2(0x060c18, 0.012);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    // Refletor principal sobre a mesa
    this.tableSpot = new THREE.SpotLight(0xffffff, 1.85);
    this.tableSpot.position.set(0, 9.5, 0);
    this.tableSpot.target.position.set(0, 0.75, 0);
    this.tableSpot.angle = Math.PI / 3.8;
    this.tableSpot.penumbra = 0.35;
    this.tableSpot.castShadow = true;
    this.tableSpot.shadow.mapSize.width = 2048;
    this.tableSpot.shadow.mapSize.height = 2048;
    this.scene.add(this.tableSpot);
    this.scene.add(this.tableSpot.target);

    // Iluminação do estádio estilo broadcast EA FC
    const light1 = new THREE.DirectionalLight(0x93c5fd, 0.6);
    light1.position.set(-14, 15, 14);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xfef08a, 0.5);
    light2.position.set(14, 15, -14);
    this.scene.add(light2);
  }

  buildOlympicGym() {
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d');
    ctx.fillStyle = '#b3783c';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 512; i += 16) {
      ctx.fillStyle = i % 32 === 0 ? '#9c6630' : '#bb8044';
      ctx.fillRect(0, i, 512, 14);
      ctx.fillStyle = '#7a4e22';
      ctx.fillRect(0, i + 14, 512, 2);
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(14, 14);

    const floorGeo = new THREE.PlaneGeometry(54, 54);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.28,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Tapete olímpico azul ao redor da mesa ampliada em 20%
    const carpetGeo = new THREE.PlaneGeometry(14.0, 23.0);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.55
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = 0.005;
    carpet.receiveShadow = true;
    this.scene.add(carpet);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const createLine = (w, h, x, z) => {
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(x, 0.008, z);
      this.scene.add(lineMesh);
    };
    // Linhas proporcionais à mesa nova (5.18m x 2.74m)
    createLine(13.2, 0.08, 0, -11.0);
    createLine(13.2, 0.08, 0, 11.0);
    createLine(0.08, 22.0, -6.6, 0);
    createLine(0.08, 22.0, 6.6, 0);
    createLine(13.2, 0.06, 0, 0);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x050912, roughness: 0.95 });
    const createWall = (w, h, x, y, z, rotY) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
      wall.position.set(x, y, z);
      wall.rotation.y = rotY;
      this.scene.add(wall);
    };
    createWall(54, 16, 0, 8, -27, 0);
    createWall(54, 16, 0, 8, 27, Math.PI);
    createWall(54, 16, -27, 8, 0, Math.PI / 2);
    createWall(54, 16, 27, 8, 0, -Math.PI / 2);

    // Quadros históricos em preto e branco nas paredes (estilo foto Real Madrid lounge)
    const createPhotoFrame = (x, y, z, rotY, title) => {
      const frameGroup = new THREE.Group();
      frameGroup.position.set(x, y, z);
      frameGroup.rotation.y = rotY;

      // Moldura externa escura com borda dourada
      const borderMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.8, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      frameGroup.add(borderMesh);

      // Canvas da foto clássica de futebol
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 256;
      pCanvas.height = 192;
      const pCtx = pCanvas.getContext('2d');
      pCtx.fillStyle = '#0f172a';
      pCtx.fillRect(0, 0, 256, 192);

      // Foto sépia / P&B vintage
      const grad = pCtx.createLinearGradient(0, 0, 256, 192);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#64748b');
      grad.addColorStop(1, '#1e293b');
      pCtx.fillStyle = grad;
      pCtx.fillRect(12, 12, 232, 168);

      // Silhuetas de jogadores históricos
      pCtx.fillStyle = '#090d16';
      pCtx.beginPath();
      pCtx.arc(100, 70, 16, 0, Math.PI * 2);
      pCtx.arc(156, 75, 14, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.fillRect(86, 86, 28, 55);
      pCtx.fillRect(144, 89, 24, 52);

      pCtx.fillStyle = '#f8fafc';
      pCtx.font = 'bold 12px Arial';
      pCtx.textAlign = 'center';
      pCtx.fillText(title, 128, 172);

      const pTex = new THREE.CanvasTexture(pCanvas);
      const picMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.6),
        new THREE.MeshBasicMaterial({ map: pTex })
      );
      picMesh.position.z = 0.05;
      frameGroup.add(picMesh);

      this.scene.add(frameGroup);
    };

    createPhotoFrame(-18, 5.5, -26.8, 0, 'REAL MADRID LEGENDS');
    createPhotoFrame(18, 5.5, -26.8, 0, 'FUTMESA WORLD CUP');
    createPhotoFrame(-18, 5.5, 26.8, Math.PI, 'HISTORIC GOALS');
    createPhotoFrame(18, 5.5, 26.8, Math.PI, 'SPURS MEMORIES');
  }

  // --- ARQUIBANCADAS COM TORCIDA HIPER-REALISTA ESTILO EA SPORTS FC 26 / FIFA ---
  // (Inspirada fielmente nas fotos dos torcedores do Real Madrid e do Tottenham)
  buildFC26Grandstands() {
    const numTiers = 4;
    const tierWidth = 1.15;
    const tierHeight = 0.62;
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const seatBaseMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 });
    const seatBackMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const metalRailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

    // Gerador de textura procedural para camisas oficiais do EA FC / FIFA
    const createShirtTexture = (type) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      if (type === 'real_madrid') {
        // CAMISA DO REAL MADRID (FOTO 1: Torcedora e Torcedor da direita)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);

        // Listras douradas / pretas nos ombros
        ctx.fillStyle = '#eab308';
        ctx.fillRect(20, 0, 8, 70);
        ctx.fillRect(36, 0, 8, 70);
        ctx.fillRect(212, 0, 8, 70);
        ctx.fillRect(228, 0, 8, 70);

        // Patrocínio "Emirates FLY BETTER"
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Emirates', 128, 130);
        ctx.font = 'bold 13px Arial';
        ctx.fillText('FLY BETTER', 128, 150);

        // Escudo Real Madrid
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(70, 75, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(70, 75, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'tottenham') {
        // CAMISA DO TOTTENHAM (FOTO 2: Torcedora no centro gritando)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);

        // Mangas e gola azul marinho
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 60, 256);
        ctx.fillRect(196, 0, 60, 256);
        ctx.fillRect(60, 0, 136, 32);

        // Logo vermelho característico "AIA"
        ctx.fillStyle = '#dc2626';
        ctx.font = '900 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AIA', 128, 145);

        // Escudo Spurs (Galo sobre a bola)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(85, 75, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'burgundy_polo') {
        // POLO VINHO / BORDEAUX (FOTO 1: Torcedor de bigode na esquerda)
        ctx.fillStyle = '#7f1d1d'; // Crimson profundo
        ctx.fillRect(0, 0, 256, 256);

        // Padrão textura piquet
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let y = 0; y < 256; y += 8) {
          ctx.fillRect(0, y, 256, 3);
        }

        // Gola polo aberta e botões
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(116, 20, 24, 70);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 45, 3, 0, Math.PI * 2);
        ctx.arc(128, 65, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'grey_henley') {
        // CAMISETA HENLEY CINZA MESCLA (FOTO 1: Torcedor sorridente ao lado)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, 0, 256, 256);

        // Textura mescla
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let y = 0; y < 256; y += 4) {
          ctx.fillRect(0, y, 256, 2);
        }

        // Abertura henley com botões
        ctx.fillStyle = '#64748b';
        ctx.fillRect(120, 15, 16, 65);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(128, 35, 2.5, 0, Math.PI * 2);
        ctx.arc(128, 55, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'blue_checkered') {
        // POLO XADREZ AZUL GEOMÉTRICA (FOTO 1: Torcedor loiro na ponta direita)
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, 256, 256);

        ctx.fillStyle = '#2563eb';
        for (let x = 0; x < 256; x += 64) {
          for (let y = 0; y < 256; y += 64) {
            if ((x / 64 + y / 64) % 2 === 0) {
              ctx.fillRect(x, y, 64, 64);
            }
          }
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(112, 10, 32, 60);
      } else if (type === 'red_polo') {
        // POLO VERMELHA (FOTO 2: Torcedor de boné ao lado da torcedora)
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(115, 15, 26, 65);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 38, 3, 0, Math.PI * 2);
        ctx.arc(128, 58, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'brazil_home') {
        // CAMISA DO BRASIL CANARINHO
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(80, 0, 96, 28);
        ctx.beginPath();
        ctx.arc(75, 80, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('10', 128, 140);
      } else {
        // MOLETOM ESCURO CASUAL
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#334155';
        ctx.fillRect(100, 20, 56, 25);
      }

      return new THREE.CanvasTexture(c);
    };

    // Coleção de texturas EA FC pré-renderizadas
    const textures = {
      real_madrid: createShirtTexture('real_madrid'),
      tottenham: createShirtTexture('tottenham'),
      burgundy_polo: createShirtTexture('burgundy_polo'),
      grey_henley: createShirtTexture('grey_henley'),
      blue_checkered: createShirtTexture('blue_checkered'),
      red_polo: createShirtTexture('red_polo'),
      brazil_home: createShirtTexture('brazil_home'),
      dark_hoodie: createShirtTexture('dark_hoodie')
    };

    const fanStyles = [
      { texture: textures.real_madrid, pantsColor: 0x1e293b, name: 'real_fan_1', skin: 0xf5d0b0, hair: 0x1f1a17, hairStyle: 'female_long' },
      { texture: textures.tottenham, pantsColor: 0x334155, name: 'spurs_girl', skin: 0xf3ceb4, hair: 0x3d2719, hairStyle: 'screaming_brunette' },
      { texture: textures.burgundy_polo, pantsColor: 0x0f172a, name: 'mustache_guy', skin: 0xdfab7b, hair: 0x17120e, hairStyle: 'mustache' },
      { texture: textures.grey_henley, pantsColor: 0x1e293b, name: 'henley_smile', skin: 0xf6d3b3, hair: 0x5b3820, hairStyle: 'parted' },
      { texture: textures.blue_checkered, pantsColor: 0x0f172a, name: 'checkered_blonde', skin: 0xfce7d0, hair: 0xd4a373, hairStyle: 'blonde' },
      { texture: textures.red_polo, pantsColor: 0x1d4ed8, name: 'red_cap_fan', skin: 0xdfab7b, hair: 0x17120e, hairStyle: 'cap_backwards' },
      { texture: textures.real_madrid, pantsColor: 0xffffff, name: 'real_fan_2', skin: 0xaa724b, hair: 0x0f172a, hairStyle: 'short' },
      { texture: textures.brazil_home, pantsColor: 0x1d4ed8, name: 'brazil_fan', skin: 0xaa724b, hair: 0x17120e, hairStyle: 'short' }
    ];

    const createGrandstand = (axis, sign, startDist, length, bannerText) => {
      const group = new THREE.Group();

      for (let t = 0; t < numTiers; t++) {
        const distFromCenter = startDist + t * tierWidth;
        const stepH = (t + 1) * tierHeight;
        const posY = stepH * 0.5;

        let stepGeo, posX, posZ;
        if (axis === 'x') {
          posX = sign * distFromCenter;
          posZ = 0;
          stepGeo = new THREE.BoxGeometry(tierWidth, stepH, length);
        } else {
          posX = 0;
          posZ = sign * distFromCenter;
          stepGeo = new THREE.BoxGeometry(length, stepH, tierWidth);
        }

        const stepMesh = new THREE.Mesh(stepGeo, stepMat);
        stepMesh.position.set(posX, posY, posZ);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        group.add(stepMesh);

        // Corrimão tubular cromado na frente do degrau
        const railGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
        const rail = new THREE.Mesh(railGeo, metalRailMat);
        if (axis === 'x') {
          rail.rotation.x = Math.PI / 2;
          rail.position.set(posX - sign * (tierWidth * 0.42), stepH + 0.35, 0);
        } else {
          rail.rotation.z = Math.PI / 2;
          rail.position.set(0, stepH + 0.35, posZ - sign * (tierWidth * 0.42));
        }
        group.add(rail);

        // Cadeiras com assento e encosto
        const topY = stepH;
        for (let p = -length * 0.45; p <= length * 0.45; p += 0.95) {
          let seatX = posX;
          let seatZ = posZ;
          if (axis === 'x') seatZ = p;
          else seatX = p;

          const seatGroup = new THREE.Group();
          seatGroup.position.set(seatX, topY, seatZ);
          if (axis === 'x') {
            seatGroup.rotation.y = (sign === -1) ? Math.PI / 2 : -Math.PI / 2;
          } else {
            seatGroup.rotation.y = (sign === -1) ? 0 : Math.PI;
          }

          const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.45), seatBaseMat);
          seatBase.position.set(0, 0.04, 0.04);
          seatGroup.add(seatBase);

          const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.08), seatBackMat);
          seatBack.position.set(0, 0.25, -0.18);
          seatGroup.add(seatBack);
          group.add(seatGroup);

          // MODELO DO TORCEDOR EA FC 26
          const fanGroup = new THREE.Group();
          fanGroup.position.set(seatX, topY + 0.08, seatZ);
          if (axis === 'x') {
            fanGroup.rotation.y = (sign === -1) ? Math.PI / 2 : -Math.PI / 2;
          } else {
            fanGroup.rotation.y = (sign === -1) ? 0 : Math.PI;
          }

          const style = fanStyles[Math.floor(Math.random() * fanStyles.length)];

          // 1. Pernas sentadas
          const pantsMat = new THREE.MeshStandardMaterial({ color: style.pantsColor, roughness: 0.7 });
          const legGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
          const legL = new THREE.Mesh(legGeo, pantsMat);
          legL.position.set(-0.13, 0.16, 0.14);
          legL.rotation.x = Math.PI / 3;
          fanGroup.add(legL);

          const legR = legL.clone();
          legR.position.x = 0.13;
          fanGroup.add(legR);

          // Tênis
          const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
          const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.18), shoeMat);
          shoeL.position.set(-0.13, 0.04, 0.28);
          fanGroup.add(shoeL);
          const shoeR = shoeL.clone();
          shoeR.position.x = 0.13;
          fanGroup.add(shoeR);

          // 2. Tronco com a textura da camisa do EA FC
          const shirtMat = new THREE.MeshStandardMaterial({ map: style.texture, roughness: 0.55 });
          const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.52, 12), shirtMat);
          torso.position.y = 0.48;
          torso.castShadow = true;
          fanGroup.add(torso);

          // 3. Cabeça e Rosto
          const skinMat = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.8 });
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), skinMat);
          head.position.y = 0.90;
          head.castShadow = true;
          fanGroup.add(head);

          // Detalhes faciais únicos dos personagens das fotos:
          if (style.hairStyle === 'mustache') {
            // Bigode estilo foto 1 (torcedor camisa vinho)
            const stacheMesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.10, 0.03, 0.04),
              new THREE.MeshStandardMaterial({ color: 0x111827 })
            );
            stacheMesh.position.set(0, 0.88, 0.13);
            fanGroup.add(stacheMesh);
          } else if (style.hairStyle === 'screaming_brunette') {
            // Boca aberta gritando / comemorando (foto 2 torcedora Tottenham)
            const mouthMesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.04, 0.02),
              new THREE.MeshBasicMaterial({ color: 0x09090b })
            );
            mouthMesh.position.set(0, 0.87, 0.138);
            fanGroup.add(mouthMesh);
          }

          // Cabelo / Penteado / Boné
          if (style.hairStyle === 'cap_backwards') {
            // Boné virado para trás (estilo foto 2)
            const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.146, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
            cap.position.y = 0.94;
            fanGroup.add(cap);
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.12), capMat);
            visor.position.set(0, 0.93, -0.13); // virado para trás!
            fanGroup.add(visor);
          } else if (style.hairStyle === 'female_long') {
            // Cabelo longo castanho / moreno com rabo de cavalo (foto 1 moça do Real Madrid)
            const hairMat = new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.9 });
            const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.146, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
            hairCap.position.y = 0.94;
            fanGroup.add(hairCap);
            const ponytail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.32, 8), hairMat);
            ponytail.position.set(0, 0.86, -0.17);
            ponytail.rotation.x = -Math.PI / 4;
            fanGroup.add(ponytail);
          } else {
            // Cabelo curto modelado
            const hairMat = new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.9 });
            const hair = new THREE.Mesh(new THREE.SphereGeometry(0.146, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2.1), hairMat);
            hair.position.y = 0.93;
            fanGroup.add(hair);
          }

          // 4. POSES DE COMEMORAÇÃO E ACESSÓRIOS DO EA FC 26
          // (Punho alto como na Foto 1, torcida gritando Foto 2, cachecóis e bandeiras)
          const poseRoll = Math.random();
          let archetype = 'cheer';
          let armL, armR, propMesh = null;
          const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.38, 8);
          armL = new THREE.Mesh(armGeo, shirtMat);
          armR = new THREE.Mesh(armGeo, shirtMat);

          if (poseRoll < 0.28) {
            // ARQUÉTIPO 1: BRAÇO ERGUIDO BEM ALTO COM O PUNHO FECHADO NO AR (ÍCONE DA FOTO 1)
            archetype = 'fist_high';
            armL.position.set(-0.24, 0.52, 0.05);
            armL.rotation.z = Math.PI / 4;

            // Braço direito estendido verticalmente para o céu
            armR.position.set(0.24, 0.76, 0.05);
            armR.rotation.z = -Math.PI / 1.15;

            // Punho cerrado no ar
            const fist = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat);
            fist.position.y = -0.22;
            armR.add(fist);
          } else if (poseRoll < 0.50) {
            // ARQUÉTIPO 2: TORCEDOR COM CACHECOL ESTICADO COM AS DUAS MÃOS ("¡POR SIEMPRE REAL MADRID!")
            archetype = 'scarf';
            armL.position.set(-0.24, 0.62, 0.05);
            armL.rotation.z = Math.PI / 1.35;
            armR.position.set(0.24, 0.62, 0.05);
            armR.rotation.z = -Math.PI / 1.35;

            const scarfCanvas = document.createElement('canvas');
            scarfCanvas.width = 256;
            scarfCanvas.height = 64;
            const sCtx = scarfCanvas.getContext('2d');
            sCtx.fillStyle = '#ffffff';
            sCtx.fillRect(0, 0, 256, 64);
            sCtx.fillStyle = '#1d4ed8';
            sCtx.fillRect(0, 0, 256, 12);
            sCtx.fillRect(0, 52, 256, 12);
            sCtx.fillStyle = '#0f172a';
            sCtx.font = '900 16px Arial';
            sCtx.textAlign = 'center';
            sCtx.fillText('REAL MADRID CF', 128, 38);

            const scarfTex = new THREE.CanvasTexture(scarfCanvas);
            propMesh = new THREE.Mesh(
              new THREE.PlaneGeometry(0.72, 0.18),
              new THREE.MeshBasicMaterial({ map: scarfTex, side: THREE.DoubleSide })
            );
            propMesh.position.set(0, 1.25, 0.08);
            fanGroup.add(propMesh);
          } else if (poseRoll < 0.72) {
            // ARQUÉTIPO 3: GRITANDO E COMEMORANDO COM OS DOIS BRAÇOS (FOTO 2 TOTTENHAM)
            archetype = 'screaming_cheer';
            armL.position.set(-0.26, 0.60, 0.1);
            armL.rotation.z = Math.PI / 2.2;
            armL.rotation.x = -Math.PI / 5;

            armR.position.set(0.26, 0.60, 0.1);
            armR.rotation.z = -Math.PI / 2.2;
            armR.rotation.x = -Math.PI / 5;
          } else {
            // ARQUÉTIPO 4: BANDEIRA TREMULANDO NO MASTRO
            archetype = 'flag';
            armL.position.set(-0.22, 0.52, 0.05);
            armL.rotation.z = Math.PI / 3;
            armR.position.set(0.22, 0.65, 0.1);
            armR.rotation.z = -Math.PI / 1.4;

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 6), metalRailMat);
            pole.position.set(0.32, 0.95, 0.15);
            pole.rotation.z = -Math.PI / 6;

            const flagCanvas = document.createElement('canvas');
            flagCanvas.width = 128;
            flagCanvas.height = 96;
            const fCtx = flagCanvas.getContext('2d');
            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(0, 0, 128, 96);
            fCtx.fillStyle = '#eab308';
            fCtx.fillRect(0, 0, 128, 16);
            fCtx.fillRect(0, 80, 128, 16);
            fCtx.fillStyle = '#1e3a8a';
            fCtx.font = '900 18px Arial';
            fCtx.textAlign = 'center';
            fCtx.fillText('MADRID', 64, 54);

            const flagTex = new THREE.CanvasTexture(flagCanvas);
            const flagCloth = new THREE.Mesh(
              new THREE.PlaneGeometry(0.48, 0.34),
              new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide })
            );
            flagCloth.position.set(0.20, 0.28, 0);
            pole.add(flagCloth);
            propMesh = pole;
            fanGroup.add(pole);
          }

          fanGroup.add(armL);
          fanGroup.add(armR);

          fanGroup.userData = {
            baseY: fanGroup.position.y,
            phase: Math.random() * Math.PI * 2,
            speed: 2.3 + Math.random() * 2.4,
            archetype,
            armL,
            armR,
            propMesh
          };

          this.crowdMembers.push(fanGroup);
          group.add(fanGroup);
        }
      }

      // Painéis digitais de LED Ribbon estilo EA SPORTS FC ao redor do gramado
      const ledCanvas = document.createElement('canvas');
      ledCanvas.width = 1024;
      ledCanvas.height = 128;
      const lCtx = ledCanvas.getContext('2d');
      lCtx.fillStyle = '#0a0f1d';
      lCtx.fillRect(0, 0, 1024, 128);

      lCtx.fillStyle = '#38bdf8';
      lCtx.fillRect(0, 0, 1024, 8);
      lCtx.fillRect(0, 120, 1024, 8);

      lCtx.fillStyle = '#f8fafc';
      lCtx.font = '900 36px Arial';
      lCtx.textAlign = 'center';
      lCtx.textBaseline = 'middle';
      lCtx.fillText(`⚽ EA SPORTS FC 26 • FUTMESA PRO • ${bannerText} • #LUCAS10 ⚽`, 512, 64);

      const ledTex = new THREE.CanvasTexture(ledCanvas);
      const ledMat = new THREE.MeshBasicMaterial({ map: ledTex });
      const ledMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(20, length * 0.9), 1.15),
        ledMat
      );

      if (axis === 'x') {
        ledMesh.position.set(sign * (startDist - tierWidth * 0.45), 0.65, 0);
        ledMesh.rotation.y = (sign === -1) ? Math.PI / 2 : -Math.PI / 2;
      } else {
        ledMesh.position.set(0, 0.65, sign * (startDist - tierWidth * 0.45));
        ledMesh.rotation.y = (sign === -1) ? 0 : Math.PI;
      }
      group.add(ledMesh);

      // FAIXAS SUSPENSAS NO ALTO DA ARQUIBANCADA (IGUAL DA FOTO REAL MADRID "¡POR SIEMPRE REAL MADRID!" E "SINCE 1902")
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 512;
      bannerCanvas.height = 96;
      const bCtx = bannerCanvas.getContext('2d');
      bCtx.fillStyle = '#f8fafc';
      bCtx.fillRect(0, 0, 512, 96);
      bCtx.lineWidth = 6;
      bCtx.strokeStyle = '#1e3a8a';
      bCtx.strokeRect(3, 3, 506, 90);
      bCtx.fillStyle = '#0f172a';
      bCtx.font = '900 24px Arial';
      bCtx.textAlign = 'center';
      bCtx.fillText(bannerText, 256, 46);
      bCtx.font = 'bold 15px Arial';
      bCtx.fillStyle = '#eab308';
      bCtx.fillText('★ OFFICIAL MATCHDAY ATMOSPHERE ★', 256, 75);

      const bannerTex = new THREE.CanvasTexture(bannerCanvas);
      const hangingBanner = new THREE.Mesh(
        new THREE.PlaneGeometry(7.0, 1.4),
        new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
      );

      const topStandY = numTiers * tierHeight + 1.6;
      if (axis === 'x') {
        hangingBanner.position.set(sign * (startDist + numTiers * tierWidth * 0.6), topStandY, 0);
        hangingBanner.rotation.y = (sign === -1) ? Math.PI / 2 : -Math.PI / 2;
      } else {
        hangingBanner.position.set(0, topStandY, sign * (startDist + numTiers * tierWidth * 0.6));
        hangingBanner.rotation.y = (sign === -1) ? 0 : Math.PI;
      }
      group.add(hangingBanner);

      this.scene.add(group);
    };

    // 4 SETORES DA ARENA (360° TOTAL) COM O ESTILO DENSE DO EA FC E FAIXAS DAS FOTOS
    createGrandstand('x', -1, 7.8, 25.0, 'olimpíadas • ¡vamos ate o fim');
    createGrandstand('x', 1, 7.8, 25.0, 'futmesa • adidas fotbol');
    createGrandstand('z', -1, 13.5, 22.0, 'EA SPORTS FC 27 • FUTMESA CHAMPIONS');
    createGrandstand('z', 1, 13.5, 22.0, 'TORCIDA BRASIL • #LUCAS10');
  }

  // --- MESA OFICIAL AMPLIADA E DESTACADA ---
  buildUltraVisibleTable() {
    this.tableGroup = new THREE.Group();

    const L = CONFIG.tableLength;
    const W = CONFIG.tableWidth;
    const H_center = CONFIG.tableHeightCenter;
    const drop = CONFIG.tableCurveDrop;
    const segmentsZ = 48;
    const segmentsX = 24;

    const a = drop / ((L / 2) * (L / 2));
    this.curveFactorA = a;
    this.tableYCenter = H_center;

    const tableGeom = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let iz = 0; iz <= segmentsZ; iz++) {
      const v = iz / segmentsZ;
      const z = -L / 2 + v * L;
      const y = H_center - a * (z * z);
      const dy_dz = -2 * a * z;

      for (let ix = 0; ix <= segmentsX; ix++) {
        const u = ix / segmentsX;
        const x = -W / 2 + u * W;

        vertices.push(x, y, z);
        const ny = 1 / Math.sqrt(1 + dy_dz * dy_dz);
        const nz = -dy_dz / Math.sqrt(1 + dy_dz * dy_dz);
        normals.push(0, ny, nz);
        uvs.push(u, v);
      }
    }

    for (let iz = 0; iz < segmentsZ; iz++) {
      for (let ix = 0; ix < segmentsX; ix++) {
        const aIdx = iz * (segmentsX + 1) + ix;
        const bIdx = aIdx + 1;
        const cIdx = (iz + 1) * (segmentsX + 1) + ix;
        const dIdx = cIdx + 1;
        indices.push(aIdx, cIdx, bIdx);
        indices.push(bIdx, cIdx, dIdx);
      }
    }

    tableGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    tableGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    tableGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    tableGeom.setIndex(indices);

    const tableCanvas = document.createElement('canvas');
    tableCanvas.width = 1024;
    tableCanvas.height = 2048;
    const tCtx = tableCanvas.getContext('2d');

    tCtx.fillStyle = '#1d4ed8';
    tCtx.fillRect(0, 0, 1024, 2048);

    const grad = tCtx.createLinearGradient(0, 0, 0, 2048);
    grad.addColorStop(0, '#172554');
    grad.addColorStop(0.5, '#2563eb');
    grad.addColorStop(1, '#172554');
    tCtx.fillStyle = grad;
    tCtx.fillRect(16, 16, 1024 - 32, 2048 - 32);

    tCtx.lineWidth = 32;
    tCtx.strokeStyle = '#ffffff';
    tCtx.strokeRect(16, 16, 1024 - 32, 2048 - 32);

    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 380, 1024, 28);
    tCtx.fillRect(0, 2048 - 408, 1024, 28);
    tCtx.fillRect(504, 0, 16, 2048);

    const drawEmblem = (cy) => {
      tCtx.beginPath();
      tCtx.arc(512, cy, 80, 0, Math.PI * 2);
      tCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      tCtx.fill();
      tCtx.lineWidth = 6;
      tCtx.strokeStyle = '#ffffff';
      tCtx.stroke();
    };
    drawEmblem(680);
    drawEmblem(2048 - 680);

    const tableTex = new THREE.CanvasTexture(tableCanvas);
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTex,
      roughness: 0.25,
      metalness: 0.15,
      side: THREE.DoubleSide
    });

    const tableMesh = new THREE.Mesh(tableGeom, tableMat);
    tableMesh.castShadow = true;
    tableMesh.receiveShadow = true;
    this.tableGroup.add(tableMesh);

    // Bordas laterais ciano
    const curvePointsLeft = [];
    const curvePointsRight = [];
    for (let iz = 0; iz <= segmentsZ; iz++) {
      const v = iz / segmentsZ;
      const z = -L / 2 + v * L;
      const y = H_center - a * (z * z) + 0.007;
      curvePointsLeft.push(new THREE.Vector3(-W / 2, y, z));
      curvePointsRight.push(new THREE.Vector3(W / 2, y, z));
    }
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 5 });
    const edgeLeft = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curvePointsLeft), edgeMat);
    const edgeRight = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curvePointsRight), edgeMat);
    this.tableGroup.add(edgeLeft);
    this.tableGroup.add(edgeRight);

    // Rede Central
    const netGeo = new THREE.BoxGeometry(W, CONFIG.netHeight, 0.024);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.82,
      roughness: 0.1
    });
    this.netMesh = new THREE.Mesh(netGeo, netMat);
    this.netMesh.position.set(0, H_center + CONFIG.netHeight / 2, 0);
    this.netMesh.castShadow = true;
    this.tableGroup.add(this.netMesh);

    const netTop = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.08, 0.024, 0.034),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    netTop.position.set(0, H_center + CONFIG.netHeight, 0);
    this.tableGroup.add(netTop);

    const postMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 });
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, CONFIG.netHeight + 0.1, 12);

    const postLeft = new THREE.Mesh(postGeo, postMat);
    postLeft.position.set(-W / 2 - 0.035, H_center + CONFIG.netHeight / 2 - 0.02, 0);
    this.tableGroup.add(postLeft);

    const postRight = new THREE.Mesh(postGeo, postMat);
    postRight.position.set(W / 2 + 0.035, H_center + CONFIG.netHeight / 2 - 0.02, 0);
    this.tableGroup.add(postRight);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const legGeo = new THREE.BoxGeometry(0.1, 0.70, 0.1);
    [
      [-W * 0.42, 0.35, -L * 0.38],
      [W * 0.42, 0.35, -L * 0.38],
      [-W * 0.42, 0.35, L * 0.38],
      [W * 0.42, 0.35, L * 0.38]
    ].forEach(p => {
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.position.set(...p);
      leg.castShadow = true;
      this.tableGroup.add(leg);
    });

    this.scene.add(this.tableGroup);
  }

  buildRefereeNPC() {
    this.refereeGroup = new THREE.Group();
    this.refereeGroup.position.set(2.6, 0, 0);
    this.refereeGroup.rotation.y = -Math.PI / 2;

    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), standMat);
    platform.position.y = 1.05;
    this.refereeGroup.add(platform);

    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8);
    [[-0.38, 0.52, -0.38], [0.38, 0.52, -0.38], [-0.38, 0.52, 0.38], [0.38, 0.52, 0.38]].forEach(pos => {
      const leg = new THREE.Mesh(postGeo, standMat);
      leg.position.set(...pos);
      this.refereeGroup.add(leg);
    });

    const refCanvas = document.createElement('canvas');
    refCanvas.width = 128;
    refCanvas.height = 128;
    const rCtx = refCanvas.getContext('2d');
    rCtx.fillStyle = '#ffffff';
    rCtx.fillRect(0, 0, 128, 128);
    rCtx.fillStyle = '#0f172a';
    for (let x = 0; x < 128; x += 16) {
      rCtx.fillRect(x, 0, 8, 128);
    }
    const shirtTex = new THREE.CanvasTexture(refCanvas);
    const shirtMat = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.7 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.6, 12), shirtMat);
    torso.position.y = 1.45;
    this.refereeGroup.add(torso);

    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const legGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.11, 1.0, 0.15);
    legL.rotation.x = Math.PI / 3;
    this.refereeGroup.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.11;
    this.refereeGroup.add(legR);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), skinMat);
    head.position.y = 1.88;
    this.refereeGroup.add(head);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    cap.position.y = 1.92;
    this.refereeGroup.add(cap);

    const whistle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
    whistle.position.set(0, 1.82, 0.18);
    this.refereeGroup.add(whistle);

    this.refereeArmPivot = new THREE.Group();
    this.refereeArmPivot.position.set(-0.25, 1.68, 0);

    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.55, 8);
    const armMesh = new THREE.Mesh(armGeo, shirtMat);
    armMesh.position.y = -0.25;

    const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    handMesh.position.y = -0.52;
    armMesh.add(handMesh);

    this.refereeArmPivot.add(armMesh);
    this.refereeGroup.add(this.refereeArmPivot);

    this.scene.add(this.refereeGroup);

    this.refereeTargetAngleZ = 0;
    this.refereeCurrentAngleZ = 0;
  }

  refereePointTo(winner) {
    sounds.playWhistle();
    if (winner === 'player') {
      this.refereeTargetAngleZ = 1.45;
      this.celebrationIntensity = 2.0; // torcida vibra forte!
    } else {
      this.refereeTargetAngleZ = -1.45;
      this.celebrationIntensity = 0.8;
    }
    setTimeout(() => {
      this.refereeTargetAngleZ = 0;
    }, 2200);
  }

  getTableHeightAtZ(z) {
    if (Math.abs(z) > CONFIG.tableLength / 2) return null;
    return this.tableYCenter - this.curveFactorA * (z * z);
  }

  getTableNormalAtZ(z) {
    const dy_dz = -2 * this.curveFactorA * z;
    const len = Math.sqrt(1 + dy_dz * dy_dz);
    return new THREE.Vector3(0, 1 / len, -dy_dz / len);
  }

  // --- BOLA OFICIAL MIKASA FT-5 GOALMASTER (FOOTVOLLEY BALL) ---
  buildBall() {
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 1024;
    ballCanvas.height = 512;
    const bCtx = ballCanvas.getContext('2d');

    // 1. Base de couro branco nobre da Mikasa FT-5
    bCtx.fillStyle = '#f8fafc';
    bCtx.fillRect(0, 0, 1024, 512);

    // Textura sutil de couro com granulação realista
    bCtx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let py = 0; py < 512; py += 4) {
      for (let px = 0; px < 1024; px += 4) {
        if ((px + py) % 8 === 0) {
          bCtx.fillRect(px, py, 2, 2);
        }
      }
    }

    // Função para desenhar triângulos pretos característicos da Mikasa
    const drawMikasaTriangle = (cx, cy, size, rot = 0, isGoldMaster = false) => {
      bCtx.save();
      bCtx.translate(cx, cy);
      bCtx.rotate(rot);

      bCtx.beginPath();
      bCtx.moveTo(0, -size);
      bCtx.lineTo(size * 0.95, size * 0.7);
      bCtx.lineTo(-size * 0.95, size * 0.7);
      bCtx.closePath();

      // Preto profundo levemente acetinado
      bCtx.fillStyle = '#111827';
      bCtx.fill();

      // Costura na borda do gomo
      bCtx.lineWidth = 3;
      bCtx.strokeStyle = '#e2e8f0';
      bCtx.stroke();

      // Se for o gomo do "Goalmaster", desenha o boneco dourado chutando
      if (isGoldMaster) {
        bCtx.fillStyle = '#facc15';
        // Silhueta dourada do jogador chutando estilo Goalmaster da Mikasa
        bCtx.beginPath();
        // Cabeça
        bCtx.arc(0, 14, 5, 0, Math.PI * 2);
        bCtx.fill();

        // Tronco inclinado
        bCtx.beginPath();
        bCtx.moveTo(0, 18);
        bCtx.lineTo(-8, 30);
        bCtx.lineTo(-4, 32);
        bCtx.lineTo(3, 20);
        bCtx.fill();

        // Perna de chute estendida no ar
        bCtx.beginPath();
        bCtx.moveTo(-8, 30);
        bCtx.lineTo(-24, 20);
        bCtx.lineTo(-22, 16);
        bCtx.lineTo(-5, 27);
        bCtx.fill();

        // Perna de apoio
        bCtx.beginPath();
        bCtx.moveTo(-4, 32);
        bCtx.lineTo(6, 42);
        bCtx.lineTo(10, 40);
        bCtx.lineTo(0, 31);
        bCtx.fill();

        // Braços no ar para equilíbrio
        bCtx.beginPath();
        bCtx.moveTo(0, 22);
        bCtx.lineTo(14, 16);
        bCtx.lineTo(12, 13);
        bCtx.lineTo(-2, 19);
        bCtx.fill();

        // Texto dourado cursivo Goalmaster
        bCtx.fillStyle = '#facc15';
        bCtx.font = 'italic bold 9px Georgia, serif';
        bCtx.textAlign = 'center';
        bCtx.fillText('Goalmaster', 4, 53);
      }

      bCtx.restore();
    };

    // Função para desenhar o selo central oficial Mikasa FT-5
    const drawMikasaLogo = (cx, cy) => {
      bCtx.save();
      bCtx.fillStyle = '#0f172a';
      bCtx.textAlign = 'center';

      // Estrela no topo da letra I
      bCtx.font = '900 16px Arial';
      bCtx.fillText('★', cx - 9, cy - 23);

      // Logo MIKASA oficial
      bCtx.font = '900 32px Arial, Helvetica, sans-serif';
      bCtx.fillText('MIKASA', cx, cy - 2);

      // JAPAN
      bCtx.font = 'bold 10px Arial';
      bCtx.letterSpacing = '2px';
      bCtx.fillText('JAPAN', cx + 22, cy + 12);

      // FT-5 clássico bem destacado
      bCtx.font = '900 24px Arial, Helvetica, sans-serif';
      bCtx.fillText('FT-5', cx, cy + 38);

      // Footvolley ball
      bCtx.font = '600 12px Arial';
      bCtx.fillText('Footvolley ball', cx, cy + 58);

      bCtx.restore();
    };

    // Desenha as marcas e triângulos nos dois lados da esfera (frontal e traseiro)
    [256, 768].forEach((centerX, idx) => {
      const centerY = 256;

      // Triângulos pretos ao redor do painel central branco da Mikasa
      // 1. Triângulo superior
      drawMikasaTriangle(centerX, centerY - 145, 52, 0);
      // 2. Triângulo inferior com o Goalmaster dourado oficial!
      drawMikasaTriangle(centerX, centerY + 145, 54, Math.PI, true);
      // 3. Triângulos laterais
      drawMikasaTriangle(centerX - 140, centerY - 45, 50, -Math.PI / 3);
      drawMikasaTriangle(centerX + 140, centerY - 45, 50, Math.PI / 3);
      drawMikasaTriangle(centerX - 135, centerY + 75, 50, -Math.PI / 1.5);
      drawMikasaTriangle(centerX + 135, centerY + 75, 50, Math.PI / 1.5);

      // Selo central Mikasa FT-5
      drawMikasaLogo(centerX, centerY);
    });

    // Triângulos adicionais nos polos e costuras geométricas
    [0, 512, 1024].forEach(px => {
      drawMikasaTriangle(px, 120, 48, Math.PI / 2);
      drawMikasaTriangle(px, 392, 48, -Math.PI / 2);
    });

    // Linhas de costura sutis entre os gomos de couro
    bCtx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    bCtx.lineWidth = 2.5;
    [256, 768].forEach(cx => {
      bCtx.beginPath();
      bCtx.arc(cx, 256, 92, 0, Math.PI * 2);
      bCtx.stroke();
    });

    const ballTex = new THREE.CanvasTexture(ballCanvas);

    // Geometria esférica de alta definição para a bola rolar lisa
    const ballGeo = new THREE.SphereGeometry(CONFIG.ballRadius, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.28,   // Brilho acetinado do couro legítimo Mikasa
      metalness: 0.08
    });

    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    // Anel de luz ao ajeitar a bola no [Z]
    const ringGeo = new THREE.RingGeometry(0.18, 0.24, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    this.controlRing = new THREE.Mesh(ringGeo, ringMat);
    this.controlRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.controlRing);

    const shadowGeo = new THREE.CircleGeometry(CONFIG.ballRadius * 1.3, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4
    });
    this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.01;
    this.scene.add(this.ballShadow);

    this.ballVel = new THREE.Vector3(0, 0, 0);
  }

  createCharacter(shirtColor, isPlayer = false) {
    const group = new THREE.Group();

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.65, 12),
      new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 })
    );
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    const shorts = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    shorts.position.y = 0.68;
    shorts.castShadow = true;
    group.add(shorts);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf6d3b3, roughness: 0.8 })
    );
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1f1917 })
    );
    hair.position.y = 1.58;
    group.add(hair);

    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xf6d3b3 });
    const cleatMat = new THREE.MeshStandardMaterial({ color: isPlayer ? 0x38bdf8 : 0xf43f5e });

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.12, 0.55, 0);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.y = -0.25;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.2), cleatMat);
    leftFoot.position.set(0, -0.5, 0.05);
    leftFoot.castShadow = true;
    leftLegGroup.add(leftFoot);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.12, 0.55, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.y = -0.25;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);
    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.2), cleatMat);
    rightFoot.position.set(0, -0.5, 0.05);
    rightFoot.castShadow = true;
    rightLegGroup.add(rightFoot);
    group.add(rightLegGroup);

    group.userData = {
      torso,
      head,
      leftLegGroup,
      rightLegGroup,
      walkCycle: 0,
      kickTimer: 0
    };

    return group;
  }

  buildCharacters() {
    this.playerMesh = this.createCharacter(0x0284c7, true);
    this.playerPos = new THREE.Vector3(0, 0, CONFIG.tableLength / 2 + 0.85);
    this.playerMesh.position.copy(this.playerPos);
    this.scene.add(this.playerMesh);

    this.cpuMesh = this.createCharacter(0xe11d48, false);
    this.cpuPos = new THREE.Vector3(0, 0, -(CONFIG.tableLength / 2 + 0.85));
    this.cpuMesh.rotation.y = Math.PI;
    this.cpuMesh.position.copy(this.cpuPos);
    this.scene.add(this.cpuMesh);
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyF') {
        this.handleServeAction();
      }

      if (e.code === 'KeyZ') {
        this.controlBufferedTime = 0.75;
        this.tryExecuteControl();
      }

      if (e.code === 'KeyX') {
        this.handlePlayerAction('kick');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('wheel', (e) => {
      this.cameraZoom += e.deltaY * 0.0022;
      this.cameraZoom = Math.max(1.2, Math.min(4.8, this.cameraZoom));
    }, { passive: true });

    const startBtn = document.getElementById('start-btn');
    const startOverlay = document.getElementById('start-overlay');
    const diffOverlay = document.getElementById('difficulty-overlay');
    const btnAmador = document.getElementById('btn-diff-amador');
    const btnAvancado = document.getElementById('btn-diff-avancado');

    startBtn.addEventListener('click', () => {
      sounds.init();
      startOverlay.style.display = 'none';
      diffOverlay.style.display = 'flex';
    });

    const startWithDifficulty = (level) => {
      this.setDifficulty(level);
      diffOverlay.style.display = 'none';
      this.canvas.requestPointerLock();
    };

    btnAmador.addEventListener('click', () => startWithDifficulty('amador'));
    btnAvancado.addEventListener('click', () => startWithDifficulty('avancado'));

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.canvas);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sensitivity = 0.0022;
      this.mouseLook.yaw -= e.movementX * sensitivity;
      this.mouseLook.pitch -= e.movementY * sensitivity;
      this.mouseLook.pitch = Math.max(-0.35, Math.min(0.65, this.mouseLook.pitch));
    });
  }

  resetRound(serverSide = 'player') {
    this.roundOver = false;
    this.server = serverSide;
    this.sideWithBall = serverSide;
    this.touches = 0;
    this.tableBouncesThisTurn = 0;
    this.lastBouncedSide = null;
    this.lastHitter = serverSide;
    this.isWaitingServe = true;
    this.controlBufferedTime = 0;
    this.updateHUD();

    const tableHalf = CONFIG.tableLength / 2;

    if (serverSide === 'player') {
      this.playerPos.set(0, 0, tableHalf + 0.85);
      this.ball.position.set(this.playerPos.x, 1.1, this.playerPos.z - 0.5);
      this.ballVel.set(0, 0, 0);
    } else {
      this.cpuPos.set(0, 0, -(tableHalf + 0.85));
      this.ball.position.set(this.cpuPos.x, 1.1, this.cpuPos.z + 0.5);
      this.ballVel.set(0, 0, 0);
      setTimeout(() => {
        if (this.server === 'cpu' && !this.roundOver && this.isWaitingServe) {
          this.cpuServe();
        }
      }, 1400);
    }
  }

  handleServeAction() {
    if (this.roundOver || !this.isWaitingServe || this.server !== 'player') return;

    this.isWaitingServe = false;
    this.touches = 1;
    this.lastHitter = 'player';
    this.sideWithBall = 'cpu';
    this.tableBouncesThisTurn = 0;
    this.lastBouncedSide = null;

    const aimDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);
    const targetZ = -1.0 + Math.min(0.3, Math.max(-0.5, aimDir.z));
    const targetX = Math.max(-0.75, Math.min(0.75, aimDir.x * 2.2));
    const targetY = this.getTableHeightAtZ(targetZ) || 0.76;

    this.launchBallToTarget(this.ball.position, new THREE.Vector3(targetX, targetY, targetZ), 0.84);

    sounds.playKick();
    this.playerMesh.userData.kickTimer = 0.35;
    this.updateHUD();
  }

  cpuServe() {
    this.isWaitingServe = false;
    this.touches = 1;
    this.lastHitter = 'cpu';
    this.sideWithBall = 'player';
    this.tableBouncesThisTurn = 0;
    this.lastBouncedSide = null;

    const flightTime = (this.difficulty === 'amador') ? 1.08 : 0.86;
    const targetX = (Math.random() - 0.5) * (CONFIG.tableWidth * 0.6);
    const targetZ = 0.9 + Math.random() * 0.5;
    const targetY = this.getTableHeightAtZ(targetZ) || 0.76;

    this.launchBallToTarget(this.ball.position, new THREE.Vector3(targetX, targetY, targetZ), flightTime);
    sounds.playKick();
    this.cpuMesh.userData.kickTimer = 0.35;
    this.updateHUD();
  }

  tryExecuteControl() {
    if (this.roundOver) return false;

    if (this.isWaitingServe && this.server === 'player') {
      this.handleServeAction();
      return true;
    }

    const ballX = this.ball.position.x;
    const ballY = this.ball.position.y;
    const ballZ = this.ball.position.z;

    // A bola PRECISA estar no lado do jogador (z > 0) para poder ajeitar
    const ballOnPlayerSide = ballZ > 0.05;

    // Distância horizontal real entre jogador e bola
    const distToBall = this.playerPos.distanceTo(new THREE.Vector3(ballX, 0, ballZ));

    // Alcance curto: só pega a bola se estiver MUITO próximo (máx 1.4m)
    // Isso evita o problema de pegar tudo do meio da quadra
    const inReach = distToBall < 1.4 &&
                    ballY < 2.8 &&
                    ballY > 0.05 &&
                    ballOnPlayerSide;

    if (!inReach) return false;

    if (this.touches >= CONFIG.maxTouches) {
      return false;
    }

    this.controlBufferedTime = 0;
    this.touches++;
    this.sideWithBall = 'player';
    this.lastHitter = 'player';
    this.tableBouncesThisTurn = 0;

    this.ball.position.x = this.playerPos.x * 0.8 + this.ball.position.x * 0.2;
    this.ball.position.z = this.playerPos.z - 0.5;
    this.ball.position.y = Math.max(0.9, Math.min(1.4, this.ball.position.y));

    this.ballVel.set(0, 5.4, -0.1);

    this.controlRing.position.set(this.ball.position.x, this.ball.position.y, this.ball.position.z);
    this.controlRing.material.opacity = 0.85;
    this.controlRing.scale.set(1, 1, 1);

    sounds.playControl();
    this.playerMesh.userData.kickTimer = 0.25;
    this.updateHUD();
    return true;
  }

  handlePlayerAction(type) {
    if (this.roundOver) return;

    if (this.isWaitingServe && this.server === 'player') {
      this.handleServeAction();
      return;
    }

    const ballX = this.ball.position.x;
    const ballY = this.ball.position.y;
    const ballZ = this.ball.position.z;

    // Chute também exige que a bola esteja do lado do jogador (z > 0)
    // e bem perto dele (máx 1.6m horizontal)
    const distToBall = this.playerPos.distanceTo(new THREE.Vector3(ballX, 0, ballZ));
    const ballOnPlayerSide = ballZ > 0.0;
    const inReach = distToBall < 1.6 && ballY < 2.8 && ballY > 0.05 && ballOnPlayerSide;

    if (!inReach) return;

    if (type === 'kick') {
      this.touches++;
      this.lastHitter = 'player';
      this.sideWithBall = 'cpu';
      this.tableBouncesThisTurn = 0;
      this.lastBouncedSide = null;

      const aimDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);
      const targetZ = -1.1 + Math.min(0.4, Math.max(-0.55, aimDir.z));
      const targetX = Math.max(-0.8, Math.min(0.8, aimDir.x * 2.4));
      const targetY = this.getTableHeightAtZ(targetZ) || 0.76;

      const flightDuration = 0.76;
      this.launchBallToTarget(this.ball.position, new THREE.Vector3(targetX, targetY, targetZ), flightDuration);

      sounds.playKick();
      this.playerMesh.userData.kickTimer = 0.35;
      this.updateHUD();
    }
  }

  launchBallToTarget(start, target, time) {
    const vx = (target.x - start.x) / time;
    const vz = (target.z - start.z) / time;
    const vy = (target.y - start.y + 0.5 * CONFIG.gravity * time * time) / time;
    this.ballVel.set(vx, vy, vz);
  }

  updateCPU(dt) {
    if (this.isWaitingServe && this.server === 'cpu') {
      this.cpuMesh.position.copy(this.cpuPos);
      return;
    }

    const isAmador = (this.difficulty === 'amador');
    const cpuSpeed = isAmador ? 2.9 : 4.4;
    const tableHalf = CONFIG.tableLength / 2;

    // --- POSICIONAMENTO DO CPU ---
    // O CPU fica SEMPRE no seu lado (z negativo).
    // Ele só se move lateralmente para acompanhar o X da bola
    // quando a bola está vindo para o lado dele.

    // X: seguir o X da bola com pequeno atraso (não espelha o jogador)
    const targetX = Math.max(-2.8, Math.min(2.8, this.ball.position.x * 0.85));

    // Z: posição padrão atrás da mesa no lado negativo
    // Avança para interceptar SOMENTE se a bola estiver vindo para o lado dele (z < 0, vel.z < 0)
    let targetZ = -(tableHalf + 0.85);
    const ballComingToCpuSide = this.ball.position.z < 0 && this.ballVel.z < 0;
    if (ballComingToCpuSide) {
      // Interceptar: aproxima-se do ponto onde a bola vai chegar, mas sem cruzar a mesa
      const interceptZ = Math.max(-(tableHalf + 1.5), Math.min(-(tableHalf + 0.3), this.ball.position.z - 0.5));
      targetZ = interceptZ;
    }

    const moveDirX = targetX - this.cpuPos.x;
    const moveDirZ = targetZ - this.cpuPos.z;
    const dist = Math.hypot(moveDirX, moveDirZ);

    if (dist > 0.05) {
      const step = Math.min(dist, cpuSpeed * dt);
      this.cpuPos.x += (moveDirX / dist) * step;
      this.cpuPos.z += (moveDirZ / dist) * step;
      this.cpuMesh.userData.walkCycle += dt * 10;
    }

    // Limites de colisão do CPU — nunca entra na mesa (z > -tableHalf - 0.4)
    const cpuMinZ = -(tableHalf + 0.35);  // nunca passa para cima da mesa
    const cpuMaxZ = -(tableHalf + 2.0);   // não recua demais
    const tableLimitX = CONFIG.tableWidth / 2 + 0.4;

    if (Math.abs(this.cpuPos.x) < tableLimitX) {
      this.cpuPos.z = Math.min(cpuMinZ, this.cpuPos.z);
    } else {
      this.cpuPos.z = Math.min(-0.5, this.cpuPos.z);
    }
    this.cpuPos.z = Math.max(cpuMaxZ, this.cpuPos.z);
    this.cpuPos.x = Math.max(-4.5, Math.min(4.5, this.cpuPos.x));
    this.cpuMesh.position.copy(this.cpuPos);

    // --- LÓGICA DE REBATER A BOLA ---
    // CPU só age quando a bola está NO SEU LADO (z < 0) e o CPU tem a vez
    const distToBall = this.cpuPos.distanceTo(new THREE.Vector3(this.ball.position.x, 0, this.ball.position.z));
    const ballInPlayOnCpuSide = this.ball.position.z < -0.1 &&
                                this.ball.position.y < 2.5 &&
                                this.ball.position.y > 0.15;

    if (distToBall < 1.6 && ballInPlayOnCpuSide && this.sideWithBall === 'cpu' && !this.roundOver) {
      // Advanced mode intentional error (08% chance)
      if (!isAmador && Math.random() < 0.08) {
        // Erro proposital no modo avançado
        this.touches++;
        this.sideWithBall = 'player';
        this.lastHitter = 'cpu';
        this.tableBouncesThisTurn = 0;
        this.lastBouncedSide = null;
        if (Math.random() < 0.5) {
          this.launchBallToTarget(this.ball.position, new THREE.Vector3(0, 0.75, 0), 0.7);
        } else {
          const outX = (Math.random() < 0.5 ? -1 : 1) * (CONFIG.tableWidth / 2 + 0.5);
          this.launchBallToTarget(this.ball.position, new THREE.Vector3(outX, 0.4, 1.2), 0.8);
        }
        sounds.playKick();
        this.cpuMesh.userData.kickTimer = 0.35;
        this.updateHUD();
        return;
      }

      if (isAmador && Math.random() < 0.28) {
        // Erro proposital no modo amador
        this.touches++;
        this.sideWithBall = 'player';
        this.lastHitter = 'cpu';
        this.tableBouncesThisTurn = 0;
        this.lastBouncedSide = null;

        if (Math.random() < 0.5) {
          this.launchBallToTarget(this.ball.position, new THREE.Vector3(0, 0.75, 0), 0.7);
        } else {
          const outX = (Math.random() < 0.5 ? -1 : 1) * (CONFIG.tableWidth / 2 + 0.5);
          this.launchBallToTarget(this.ball.position, new THREE.Vector3(outX, 0.4, 1.2), 0.8);
        }

        sounds.playKick();
        this.cpuMesh.userData.kickTimer = 0.35;
        this.updateHUD();
        return;
      }

      // Chute normal — envia para o lado positivo (lado do jogador)
      this.touches++;
      this.sideWithBall = 'player';
      this.lastHitter = 'cpu';
      this.tableBouncesThisTurn = 0;
      this.lastBouncedSide = null;

      const spread = isAmador ? 0.5 : 0.80;
      const rndX = (Math.random() - 0.5) * (CONFIG.tableWidth * spread);
      // Alvo sempre no lado POSITIVO (lado do jogador)
      const rndZ = 0.7 + Math.random() * 1.1;
      const rndY = this.getTableHeightAtZ(rndZ) || 0.76;

      const flightDuration = isAmador ? (0.95 + Math.random() * 0.15) : (0.72 + Math.random() * 0.1);
      this.launchBallToTarget(this.ball.position, new THREE.Vector3(rndX, rndY, rndZ), flightDuration);

      sounds.playKick();
      this.cpuMesh.userData.kickTimer = 0.35;
      this.updateHUD();
    }
  }

  scorePoint(winner, reason) {
    if (this.roundOver) return;
    this.roundOver = true;

    this.refereePointTo(winner);

    if (winner === 'player') {
      this.scorePlayer++;
      sounds.playPointCheer();
      this.showBanner('PONTO DE LUCAS! ⚽', `👉 Juiz confirmou: ${reason}`);
    } else {
      this.scoreCpu++;
      this.showBanner('PONTO DO PLAYER2!⚽ ', `👈 Juiz confirmou: ${reason}`);
    }

    this.updateHUD();

    if (this.scorePlayer >= CONFIG.winningPoints && (this.scorePlayer - this.scoreCpu) >= 2) {
      setTimeout(() => {
        this.showBanner('🏆 LUCAS É O CAMPEÃO OLÍMPICO! 🥇', 'Parabéns pela vitória espetacular!');
        setTimeout(() => this.resetMatch(), 4000);
      }, 1900);
      return;
    }
    if (this.scoreCpu >= CONFIG.winningPoints && (this.scoreCpu - this.scorePlayer) >= 2) {
      setTimeout(() => {
        this.showBanner('FIM DE JOGO!', 'O PLAYER2 venceu. Tente novamente!');
        setTimeout(() => this.resetMatch(), 4000);
      }, 1900);
      return;
    }

    const totalPoints = this.scorePlayer + this.scoreCpu;
    const nextServer = (Math.floor(totalPoints / 2) % 2 === 0) ? 'player' : 'cpu';

    setTimeout(() => {
      this.resetRound(nextServer);
    }, 2400);
  }

  resetMatch() {
    this.scorePlayer = 0;
    this.scoreCpu = 0;
    this.resetRound('player');
  }

  updatePhysics(dt) {
    if (this.roundOver) return;

    if (this.controlRing && this.controlRing.material.opacity > 0) {
      this.controlRing.material.opacity -= dt * 2.2;
      this.controlRing.scale.addScalar(dt * 3.5);
    }

    if (this.celebrationIntensity > 0) {
      this.celebrationIntensity -= dt * 0.7;
    }

    if (this.isWaitingServe) {
      if (this.server === 'player') {
        this.ball.position.set(this.playerPos.x, 1.1 + Math.sin(Date.now() * 0.005) * 0.05, this.playerPos.z - 0.5);
      } else {
        this.ball.position.set(this.cpuPos.x, 1.1 + Math.sin(Date.now() * 0.005) * 0.05, this.cpuPos.z + 0.5);
      }
      this.ballShadow.position.set(this.ball.position.x, 0.015, this.ball.position.z);
      return;
    }

    if (this.controlBufferedTime > 0) {
      this.controlBufferedTime -= dt;
      if (this.tryExecuteControl()) {
        return;
      }
    }

    this.ballVel.y -= CONFIG.gravity * dt;

    this.ball.position.x += this.ballVel.x * dt;
    this.ball.position.y += this.ballVel.y * dt;
    this.ball.position.z += this.ballVel.z * dt;

    this.ball.rotation.x += this.ballVel.z * dt * 3.5;
    this.ball.rotation.z -= this.ballVel.x * dt * 3.5;

    this.ballShadow.position.x = this.ball.position.x;
    this.ballShadow.position.z = this.ball.position.z;
    const currentTableY = this.getTableHeightAtZ(this.ball.position.z);
    const surfaceY = (currentTableY !== null && Math.abs(this.ball.position.x) <= CONFIG.tableWidth / 2) 
      ? currentTableY 
      : 0.01;
    this.ballShadow.position.y = surfaceY + 0.006;

    // Colisão com a Rede
    const prevZ = this.ball.position.z - this.ballVel.z * dt;
    if ((prevZ > 0 && this.ball.position.z <= 0.04) || (prevZ < 0 && this.ball.position.z >= -0.04)) {
      if (Math.abs(this.ball.position.x) <= CONFIG.tableWidth / 2) {
        if (this.ball.position.y <= CONFIG.tableHeightCenter + CONFIG.netHeight + 0.05) {
          this.ballVel.z *= -0.3;
          this.ballVel.x *= 0.5;
          this.ballVel.y = Math.max(1.6, this.ballVel.y * 0.4);
          sounds.playTableBounce();
        }
      }
    }

    // Colisão com o Tampo da Mesa Curvada Ampliada
    const bx = this.ball.position.x;
    const bz = this.ball.position.z;
    const by = this.ball.position.y;
    const inTableX = Math.abs(bx) <= CONFIG.tableWidth / 2;
    const inTableZ = Math.abs(bz) <= CONFIG.tableLength / 2;

    if (inTableX && inTableZ) {
      const tableY = this.getTableHeightAtZ(bz);
      if (tableY !== null && by <= tableY + CONFIG.ballRadius) {
        this.ball.position.y = tableY + CONFIG.ballRadius;
        const normal = this.getTableNormalAtZ(bz);
        const dot = this.ballVel.dot(normal);

        if (dot < 0) {
          const elasticity = 0.83;
          this.ballVel.sub(normal.clone().multiplyScalar((1 + elasticity) * dot));
          sounds.playTableBounce();

          const bounceSide = bz > 0 ? 'player' : 'cpu';
          this.tableBouncesThisTurn++;

          if (this.lastHitter === 'player') {
            if (bounceSide === 'player' && this.tableBouncesThisTurn === 1) {
              this.scorePoint('cpu', 'A bola bateu no seu próprio lado da mesa');
              return;
            }
          } else {
            if (bounceSide === 'cpu' && this.tableBouncesThisTurn === 1) {
              this.scorePoint('player', 'Adversário bateu no próprio lado da mesa');
              return;
            }
          }

          if (this.tableBouncesThisTurn > 1 && this.lastBouncedSide === bounceSide) {
            if (bounceSide === 'player') {
              this.scorePoint('cpu', 'A bola pingou duas vezes no seu lado');
            } else {
              this.scorePoint('player', 'A bola pingou duas vezes na mesa rival');
            }
            return;
          }

          this.lastBouncedSide = bounceSide;
        }
      }
    }

    // Colisão com o Chão
    if (this.ball.position.y <= CONFIG.ballRadius) {
      this.ball.position.y = CONFIG.ballRadius;
      this.ballVel.set(0, 0, 0);

      if (this.lastBouncedSide === null) {
        if (this.lastHitter === 'player') {
          this.scorePoint('cpu', 'Bola para fora! Não tocou na mesa');
        } else {
          this.scorePoint('player', 'Bola para fora do adversário!');
        }
      } else {
        if (this.lastBouncedSide === 'cpu') {
          this.scorePoint('player', 'Ponto! A bola pingou na mesa adversária e caiu');
        } else {
          this.scorePoint('cpu', 'A bola pingou no seu lado e caiu no chão');
        }
      }
    }
  }

  updatePlayer(dt) {
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);

    const moveInput = new THREE.Vector3(0, 0, 0);
    if (this.keys['ArrowUp'] || this.keys['KeyW']) moveInput.add(forward);
    if (this.keys['ArrowDown'] || this.keys['KeyS']) moveInput.sub(forward);
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveInput.sub(right);
    if (this.keys['ArrowRight'] || this.keys['KeyD']) moveInput.add(right);

    if (moveInput.lengthSq() > 0) {
      moveInput.normalize();
      this.playerPos.addScaledVector(moveInput, CONFIG.playerSpeed * dt);
      this.playerMesh.userData.walkCycle += dt * 11;
    }

    const tableLimitZ = CONFIG.tableLength / 2 + 0.4;
    const tableLimitX = CONFIG.tableWidth / 2 + 0.4;

    if (Math.abs(this.playerPos.x) < tableLimitX) {
      this.playerPos.z = Math.max(tableLimitZ, this.playerPos.z);
    } else {
      this.playerPos.z = Math.max(0.2, this.playerPos.z);
    }

    this.playerPos.z = Math.min(8.0, this.playerPos.z);
    this.playerPos.x = Math.max(-5.0, Math.min(5.0, this.playerPos.x));

    this.playerMesh.position.copy(this.playerPos);
    this.playerMesh.rotation.y = this.mouseLook.yaw + Math.PI;

    const pData = this.playerMesh.userData;
    const walkAngle = Math.sin(pData.walkCycle) * 0.45;
    pData.leftLegGroup.rotation.x = walkAngle;
    pData.rightLegGroup.rotation.x = -walkAngle;

    if (pData.kickTimer > 0) {
      pData.kickTimer -= dt;
      pData.rightLegGroup.rotation.x = -1.15;
    }

    // Câmera 3ª pessoa suave com Zoom
    const cameraDist = this.cameraZoom;
    const cameraHeight = 0.55 * this.cameraZoom + 0.3;

    const camOffset = new THREE.Vector3(0, cameraHeight, cameraDist);
    camOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.mouseLook.pitch);
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseLook.yaw);

    const targetCamPos = this.playerPos.clone().add(camOffset);
    this.camCurrentPos.lerp(targetCamPos, 0.18);
    this.camera.position.copy(this.camCurrentPos);

    const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
    lookTarget.add(forward.clone().multiplyScalar(5));
    this.camera.lookAt(lookTarget);
  }

  // --- ANIMAÇÃO HIPER-REALISTA DA TORCIDA (EA SPORTS FC 26) ---
  updateCrowd(dt, time) {
    const extraHype = this.celebrationIntensity * 0.15;

    for (let i = 0; i < this.crowdMembers.length; i++) {
      const fan = this.crowdMembers[i];
      const jumpWave = Math.sin(time * fan.userData.speed + fan.userData.phase);
      const jump = Math.max(0, jumpWave);

      // Pulo do torcedor
      fan.position.y = fan.userData.baseY + jump * (0.08 + extraHype);

      // Comportamentos específicos por arquétipo do FC 26:
      if (fan.userData.archetype === 'scarf') {
        // Balanço do cachecol esticado no ar
        const sway = Math.sin(time * 3.0 + fan.userData.phase) * 0.18;
        if (fan.userData.propMesh) {
          fan.userData.propMesh.rotation.z = sway;
          fan.userData.propMesh.position.y = 1.25 + jump * 0.08;
        }
        fan.userData.armL.rotation.z = Math.PI / 1.35 + sway * 0.5;
        fan.userData.armR.rotation.z = -Math.PI / 1.35 + sway * 0.5;
      } else if (fan.userData.archetype === 'flag') {
        // Balanço fluido da bandeira tremulando no mastro
        const flagWave = Math.sin(time * 4.2 + fan.userData.phase) * 0.35;
        if (fan.userData.propMesh) {
          fan.userData.propMesh.rotation.z = -Math.PI / 6 + flagWave * 0.4;
          fan.userData.propMesh.rotation.x = Math.cos(time * 3.5 + fan.userData.phase) * 0.2;
        }
        fan.userData.armR.rotation.z = -Math.PI / 1.4 + flagWave * 0.3;
      } else {
        // Vibração com os punhos para o alto
        fan.userData.armL.rotation.z = Math.PI / 3.2 + jump * (0.35 + extraHype);
        fan.userData.armR.rotation.z = -Math.PI / 3.2 - jump * (0.35 + extraHype);
      }
    }
  }

  updateReferee(dt) {
    if (!this.refereeArmPivot) return;
    this.refereeCurrentAngleZ += (this.refereeTargetAngleZ - this.refereeCurrentAngleZ) * (dt * 7);
    this.refereeArmPivot.rotation.z = this.refereeCurrentAngleZ;
  }

  updateHUD() {
    document.getElementById('score-player').innerText = this.scorePlayer;
    document.getElementById('score-cpu').innerText = this.scoreCpu;
    document.getElementById('touches-count').innerText = `${this.touches} / ${CONFIG.maxTouches}`;
  }

  showBanner(title, sub) {
    const banner = document.getElementById('banner-message');
    document.getElementById('banner-title').innerText = title;
    document.getElementById('banner-sub').innerText = sub;
    banner.classList.add('show');

    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      banner.classList.remove('show');
    }, 2200);
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate);

    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    const timeInSeconds = timestamp / 1000;

    this.updatePlayer(dt);
    this.updateCPU(dt);
    this.updateCrowd(dt, timeInSeconds);
    this.updateReferee(dt);
    this.updatePhysics(dt);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.futmesaGame = new FutmesaGame();
});
