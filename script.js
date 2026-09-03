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
