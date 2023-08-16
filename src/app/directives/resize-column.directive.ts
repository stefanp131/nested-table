import { Directive, ElementRef, HostListener, Input, Renderer2, RendererStyleFlags2 } from '@angular/core';

@Directive({
  selector: '[resizeColumn]'
})
export class ResizeColumnDirective {
 
  private isResizing: boolean = false;
  private originalX: number = 0;
  private originalWidth: number = 0;
  private resizeHandle: HTMLElement;


  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.createResizeHandle();
  }

  private createResizeHandle() {
    this.resizeHandle = this.renderer.createElement('div');
    this.renderer.addClass(this.resizeHandle, 'resize-handle');
    this.renderer.appendChild(this.el.nativeElement, this.resizeHandle);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (event.target === this.resizeHandle) {
      this.isResizing = true;
      this.originalX = event.pageX;
      this.originalWidth = this.el.nativeElement.offsetWidth;
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isResizing) {
      const deltaX = event.pageX - this.originalX;
      const newWidth = Math.max(this.originalWidth + deltaX, 50); //Minimum width
      this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
    }
  }
}
