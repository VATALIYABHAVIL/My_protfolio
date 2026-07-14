/* =============================================
   CurvedLoop — Vanilla JS Port of React Bits
   ============================================= */

class CurvedLoop {
  constructor(container, props = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.marqueeText = props.marqueeText || "";
    this.speed = props.speed !== undefined ? props.speed : 2;
    this.className = props.className || "";
    this.curveAmount = props.curveAmount !== undefined ? props.curveAmount : 400;
    this.direction = props.direction || "left";
    this.interactive = props.interactive !== undefined ? props.interactive : true;

    this.drag = false;
    this.lastX = 0;
    this.vel = 0;
    this.offset = 0;
    this.spacing = 0;
    this.dir = this.direction;
    this.uid = Math.random().toString(36).substring(2, 9);
    this.pathId = `curve-${this.uid}`;

    this.init();
  }

  init() {
    // Replicate useMemo logic to handle trailing spacing
    const hasTrailing = /\s|\u00A0$/.test(this.marqueeText);
    this.text = (hasTrailing ? this.marqueeText.replace(/\s+$/, '') : this.marqueeText) + '\u00A0';

    const pathD = `M-100,40 Q500,${40 + this.curveAmount} 1540,40`;
    
    this.container.innerHTML = `
      <div class="curved-loop-jacket ${!this.interactive ? 'non-interactive' : ''}" style="visibility: hidden;">
        <svg class="curved-loop-svg" viewBox="0 0 1440 120">
          <defs>
            <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="35%" stop-color="#007AFF" />
              <stop offset="65%" stop-color="#007AFF" />
              <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
            <path id="${this.pathId}" d="${pathD}" fill="none" stroke="transparent" />
          </defs>
          <text class="measure-text" xml:space="preserve" style="visibility: hidden; opacity: 0; pointer-events: none;">
            ${this.text}
          </text>
        </svg>
      </div>
    `;

    this.jacket = this.container.querySelector('.curved-loop-jacket');
    this.svg = this.container.querySelector('.curved-loop-svg');
    this.measureEl = this.container.querySelector('.measure-text');

    // Wait a brief tick for elements to be appended
    setTimeout(() => this.measureAndBuild(), 50);
  }

  measureAndBuild() {
    if (!this.measureEl) return;
    try {
      this.spacing = this.measureEl.getComputedTextLength();
    } catch (e) {
      this.spacing = 0;
    }

    if (!this.spacing) {
      setTimeout(() => this.measureAndBuild(), 100);
      return;
    }

    this.offset = -this.spacing;
    
    // Fill the SVG path width (approx 1800px width with margin)
    const repeatCount = Math.ceil(1800 / this.spacing) + 2;
    const totalText = Array(repeatCount).fill(this.text).join('');

    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textNode.setAttribute('font-weight', 'bold');
    textNode.setAttribute('xml:space', 'preserve');
    if (this.className) {
      textNode.setAttribute('class', this.className);
    }

    this.textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    this.textPath.setAttribute('href', `#${this.pathId}`);
    this.textPath.setAttribute('startOffset', `${this.offset}px`);
    this.textPath.setAttribute('xml:space', 'preserve');
    
    // Instead of raw textContent, let's allow custom styled elements or raw text
    this.textPath.textContent = totalText;

    textNode.appendChild(this.textPath);
    this.svg.appendChild(textNode);
    this.jacket.style.visibility = 'visible';

    if (this.interactive) {
      this.jacket.addEventListener('pointerdown', this.onPointerDown.bind(this));
      this.jacket.addEventListener('pointermove', this.onPointerMove.bind(this));
      this.jacket.addEventListener('pointerup', this.endDrag.bind(this));
      this.jacket.addEventListener('pointerleave', this.endDrag.bind(this));
    }

    this.startAnimation();
  }

  startAnimation() {
    const step = () => {
      if (!this.drag && this.textPath) {
        const delta = this.dir === 'right' ? this.speed : -this.speed;
        let newOffset = this.offset + delta;

        const wrapPoint = this.spacing;
        if (newOffset <= -wrapPoint) newOffset += wrapPoint;
        if (newOffset > 0) newOffset -= wrapPoint;

        this.offset = newOffset;
        this.textPath.setAttribute('startOffset', `${newOffset}px`);
      }
      this.frameId = requestAnimationFrame(step);
    };
    this.frameId = requestAnimationFrame(step);
  }

  onPointerDown(e) {
    this.drag = true;
    this.lastX = e.clientX;
    this.vel = 0;
    this.jacket.setPointerCapture(e.pointerId);
  }

  onPointerMove(e) {
    if (!this.drag || !this.textPath) return;
    const dx = e.clientX - this.lastX;
    this.lastX = e.clientX;
    this.vel = dx;

    let newOffset = this.offset + dx;
    const wrapPoint = this.spacing;
    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;

    this.offset = newOffset;
    this.textPath.setAttribute('startOffset', `${newOffset}px`);
  }

  endDrag() {
    if (!this.drag) return;
    this.drag = false;
    this.dir = this.vel > 0 ? 'right' : 'left';
  }

  destroy() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
  }
}

window.CurvedLoop = CurvedLoop;
