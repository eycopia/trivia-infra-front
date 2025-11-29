import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalType = 'alert' | 'confirm' | 'custom';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" (click)="onBackdropClick()"></div>
        
        <!-- Modal -->
        <div class="relative bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full animate-scaleIn">
          <!-- Header -->
          @if (title) {
            <div class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">{{ title }}</h3>
              @if (showCloseButton) {
                <button (click)="onCancel()" class="text-gray-400 hover:text-white transition">
                  ✕
                </button>
              }
            </div>
          }
          
          <!-- Body -->
          <div class="px-6 py-4">
            @if (message) {
              <p class="text-gray-300 whitespace-pre-line">{{ message }}</p>
            }
            <ng-content></ng-content>
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
            @if (type === 'confirm') {
              <button (click)="onCancel()" 
                      class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
                {{ cancelLabel }}
              </button>
              <button (click)="onConfirm()" 
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">
                {{ confirmLabel }}
              </button>
            } @else if (type === 'alert') {
              <button (click)="onConfirm()" 
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">
                {{ confirmLabel }}
              </button>
            } @else {
              <ng-content select="[modal-footer]"></ng-content>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }
    
    .animate-scaleIn {
      animation: scaleIn 0.2s ease-out;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() type: ModalType = 'alert';
  @Input() title = '';
  @Input() message = '';
  @Input() confirmLabel = 'Aceptar';
  @Input() cancelLabel = 'Cancelar';
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.close.emit();
  }

  onCancel() {
    this.cancel.emit();
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.close.emit();
  }

  onBackdropClick() {
    if (this.closeOnBackdrop) {
      this.onCancel();
    }
  }
}
