// --- 2D Pixel Art Render Engine Module ---

class PixelDroneRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.droneSprite = new Image();
    this.boxSprite = new Image();
    this.isLoaded = false;

    // 1. 스프라이트 이미지 로드 (추후 생성한 픽셀아트 파일 경로 입력)
    // this.droneSprite.src = 'assets/drone_pixel.png';
    // this.boxSprite.src = 'assets/box_pixel.png';
  }

  drawDrone(x, y, angle, thrusting, payloadType) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (this.isLoaded) {
      // 픽셀 아트 스프라이트 이미지가 준비되었을 때 렌더링
      ctx.drawImage(this.droneSprite, -32, -16, 64, 32);
    } else {
      // 이미지 로드 전: 순수 Canvas API 기반 픽셀 아트 그리기
      this.drawFallbackPixelDrone(ctx, thrusting);
    }

    // 매달린 화물 상자 렌더링 (화물 종류에 따른 픽셀 색상 변화)
    this.drawPayload(ctx, payloadType);

    ctx.restore();
  }

  drawFallbackPixelDrone(ctx, thrusting) {
    // 픽셀 아트 느낌을 살린 드론 몸체
    ctx.fillStyle = "#374151";
    ctx.fillRect(-24, -4, 48, 8); // 메인 프레임
    ctx.fillRect(-6, -10, 12, 12); // 중앙 자이로 센서/제어부

    // 프로펠러 가드 및 모터
    ctx.fillStyle = "#9CA3AF";
    ctx.fillRect(-28, -10, 6, 8);
    ctx.fillRect(22, -10, 6, 8);

    // 회전하는 프로펠러 블러 효과 (추력 상태에 따른 색상 변화)
    const propColor = thrusting ? "#EF4444" : "#60A5FA";
    ctx.fillStyle = propColor;
    const animOffset = (Math.floor(Date.now() / 60) % 2) * 2;
    ctx.fillRect(-34, -12 + animOffset, 18, 2);
    ctx.fillRect(16, -12 + animOffset, 18, 2);
  }

  drawPayload(ctx, payloadType) {
    // 줄(Cable) 연출
    ctx.strokeStyle = "#9CA3AF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 16);
    ctx.stroke();

    // 화물 무게별 픽셀 상자 색상 상이
    let boxColor = "#D97706"; // 기본 택배 (중간)
    if (payloadType === 'light') boxColor = "#6EE7B7"; // 편지 (가벼움)
    if (payloadType === 'heavy') boxColor = "#DC2626"; // 생수 (무거움)

    ctx.fillStyle = boxColor;
    ctx.fillRect(-8, 16, 16, 14);
    
    // 상자 테두리 & 픽셀 테이프
    ctx.fillStyle = "#78350F";
    ctx.fillRect(-2, 16, 4, 14);
  }
}
// Canvas에 레트로 픽셀 도심 배경 그리기
function drawPixelBackground(ctx, canvasWidth, canvasHeight) {
  // 1. 하늘 그라데이션 (노을/야경 분위기)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  skyGradient.addColorStop(0, '#1E1B4B'); // 딥 퍼플
  skyGradient.addColorStop(0.6, '#312E81'); 
  skyGradient.addColorStop(1, '#4C1D95');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. 원경 건물 실루엣 (멀리 있는 빌딩)
  ctx.fillStyle = '#111827';
  for (let x = 0; x < canvasWidth; x += 40) {
    const height = 80 + (Math.sin(x * 0.05) * 40);
    ctx.fillRect(x, canvasHeight - height - 30, 36, height);
  }

  // 3. 근경 아파트 건물 단지 (드론이 비행하는 주 무대)
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(550, 150, 250, canvasHeight - 180); // 베란다가 있는 목적지 아파트

  // 4. 아파트 창문 픽셀 불빛 연출
  ctx.fillStyle = '#FDE047'; // 켜진 창문 불빛 (노란색)
  for (let row = 170; row < canvasHeight - 50; row += 25) {
    for (let col = 570; col < 780; col += 20) {
      // 랜덤하게 창문 불빛 배치
      if ((row + col) % 3 === 0) {
        ctx.fillRect(col, row, 10, 12);
      }
    }
  }
}
// --- 2D Parallax Camera & Layer Engine ---

class ParallaxCamera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
  }

  // 드론의 위치를 카메라 중앙에 부드럽게 추종 (Smooth Follow)
  follow(targetX, targetY, lerpFactor = 0.08) {
    const targetCamX = targetX - this.viewportWidth / 2;
    const targetCamY = targetY - this.viewportHeight / 2;

    this.x += (targetCamX - this.x) * lerpFactor;
    this.y += (targetCamY - this.y) * lerpFactor;
  }
}

class ParallaxBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new ParallaxCamera(canvas.width, canvas.height);
  }

  render(droneX, droneY) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 카메라 위치 업데이트
    this.camera.follow(droneX, droneY);

    ctx.clearRect(0, 0, width, height);

    // [Layer 0] 최원경: 하늘 & 밤하늘 정적 배경 (이동 없음: Factor = 0.0)
    this.drawSky(ctx, width, height);

    // [Layer 1] 원경: 구름 및 달 (아주 느리게 이동: Factor = 0.05)
    this.drawFarClouds(ctx, this.camera.x * 0.05, this.camera.y * 0.02);

    // [Layer 2] 중경: 먼 도시 빌딩 실루엣 (느리게 이동: Factor = 0.2)
    this.drawDistantCity(ctx, this.camera.x * 0.2, this.camera.y * 0.1);

    // [Layer 3] 근경: 가깝고 선명한 도심 아파트 단지 (보통 속도 이동: Factor = 0.5)
    this.drawNearBuildings(ctx, this.camera.x * 0.5, this.camera.y * 0.3);

    // [Layer 4] 게임 플레이 레이어: 실제 타겟 베란다 & 드론 (카메라 1:1 추종: Factor = 1.0)
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    
    this.drawGameObjects(ctx); // 목적지 아파트 및 드론 렌더링
    
    ctx.restore();
  }

  drawSky(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0F172A'); // 슬레이트 블루
    gradient.addColorStop(1, '#334155');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  drawFarClouds(ctx, offsetX, offsetY) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    // 루프 스크롤을 위해 모듈로(%) 연산 적용
    const startX = -((offsetX) % 400);
    for (let x = startX - 400; x < this.canvas.width + 400; x += 300) {
      ctx.beginPath();
      ctx.arc(x, 100 - offsetY, 40, 0, Math.PI * 2);
      ctx.arc(x + 35, 90 - offsetY, 50, 0, Math.PI * 2);
      ctx.arc(x + 70, 100 - offsetY, 40, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDistantCity(ctx, offsetX, offsetY) {
    ctx.fillStyle = '#1E293B'; // 어두운 건물 실루엣
    const startX = -((offsetX) % 200);
    const baseY = this.canvas.height - 50 - offsetY;

    for (let x = startX - 200; x < this.canvas.width + 200; x += 60) {
      const buildingHeight = 120 + Math.abs(Math.sin(x * 0.01)) * 100;
      ctx.fillRect(x, baseY - buildingHeight, 50, buildingHeight);
    }
  }

  drawNearBuildings(ctx, offsetX, offsetY) {
    ctx.fillStyle = '#334155';
    const startX = -((offsetX) % 300);
    const baseY = this.canvas.height - offsetY;

    for (let x = startX - 300; x < this.canvas.width + 300; x += 100) {
      const height = 180 + Math.abs(Math.cos(x * 0.02)) * 120;
      ctx.fillRect(x, baseY - height, 80, height);

      // 창문 불빛 픽셀 연출
      ctx.fillStyle = '#FDE047';
      for (let wy = baseY - height + 20; wy < baseY - 20; wy += 30) {
        if ((x + wy) % 3 === 0) {
          ctx.fillRect(x + 15, wy, 15, 15);
          ctx.fillRect(x + 50, wy, 15, 15);
        }
      }
      ctx.fillStyle = '#334155';
    }
  }

  drawGameObjects(ctx) {
    // 실제 목적지 아파트 (세계 좌표계: X=1200, Y=200)
    ctx.fillStyle = '#475569';
    ctx.fillRect(1100, 150, 300, 600);

    // 베란다 착륙 패드
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(1100, 350, 100, 15);
  }
}
// --- 2D Wind Particle System Module ---

class WindParticle {
  constructor(boundsWidth, boundsHeight) {
    this.boundsWidth = boundsWidth;
    this.boundsHeight = boundsHeight;
    this.reset(true);
  }

  // 파티클 재설정 (화면 밖으로 나갈 때 재활용)
  reset(initial = false) {
    // 카메라 영역보다 넓은 범위에 생성하여 화면 전환 시 자연스럽게 보이도록 함
    this.x = initial ? Math.random() * this.boundsWidth : (Math.random() > 0.5 ? -50 : this.boundsWidth + 50);
    this.y = Math.random() * this.boundsHeight;
    
    this.length = 10 + Math.random() * 25; // 바람 선의 길이
    this.alpha = 0.2 + Math.random() * 0.5;  // 투명도
    this.size = 1 + Math.random() * 1.5;    // 선 두께
    this.depthFactor = 0.3 + Math.random() * 0.7; // 패럴랙스 입체감을 위한 깊이 계수 (0.3~1.0)
  }

  update(windX, windY, cameraVx, cameraVy, dt) {
    // 바람의 영향 + 카메라 이동에 따른 반대 방향 상대 속도 적용
    const effectiveWindX = windX * this.depthFactor - cameraVx * this.depthFactor;
    const effectiveWindY = windY * this.depthFactor - cameraVy * this.depthFactor;

    this.x += effectiveWindX * dt * 60;
    this.y += effectiveWindY * dt * 60;

    // 화면 경계를 벗어나면 반대편에서 재생성
    if (this.x < -100 || this.x > this.boundsWidth + 100 ||
        this.y < -100 || this.y > this.boundsHeight + 100) {
      this.reset();
    }
  }

  draw(ctx, windX, windY) {
    ctx.save();
    ctx.strokeStyle = `rgba(224, 242, 254, ${this.alpha})`; // 연한 하늘색/백색 톤
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);

    // 바람 세기(속도)에 비례하여 바람 선의 궤적(Tail) 길이를 연장
    const speed = Math.sqrt(windX * windX + windY * windY);
    const tailScale = Math.min(speed * 1.5, 40); // 최대 궤적 길이 제한

    // 바람 방향 각도 계산
    const angle = Math.atan2(windY, windX);
    const tailX = this.x - Math.cos(angle) * (this.length + tailScale);
    const tailY = this.y - Math.sin(angle) * (this.length + tailScale);

    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.restore();
  }
}

class WindSystem {
  constructor(maxParticles = 60, width = 800, height = 450) {
    this.width = width;
    this.height = height;
    this.particles = [];
    
    // 바람 상태 (X, Y 벡터 및 세기)
    this.windX = 0; // + : 우측 바람, - : 좌측 바람
    this.windY = 0; // + : 하강 기류, - : 상승 기류
    
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push(new WindParticle(width, height));
    }
  }

  // 바람 상태 설정 (외부 물리 엔진에서 난기류 값 전달)
  setWind(windX, windY) {
    this.windX = windX;
    this.windY = windY;
  }

  // 무작위 바람 흔들림 (돌풍/난기류 시뮬레이션)
  applyTurbulence(time) {
    // Sine 파형을 조합한 자연스러운 바람 변화
    const baseWind = this.windX;
    const gust = Math.sin(time * 2) * 3 + Math.cos(time * 5) * 2;
    this.currentWindX = baseWind + gust;
  }

  updateAndDraw(ctx, cameraVx = 0, cameraVy = 0, dt = 0.016) {
    ctx.save();
    
    for (const particle of this.particles) {
      particle.update(this.windX, this.windY, cameraVx, cameraVy, dt);
      particle.draw(ctx, this.windX, this.windY);
    }

    ctx.restore();
  }
}
