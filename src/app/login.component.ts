
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans relative">

      <!-- Logo TRIVIA -->
      <div class="text-center mb-8">
        <h1 class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">TRIVIA</h1>
      </div>

      <!-- Tarjeta de Ingreso -->
      <div class="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div class="mb-4">
          <label class="block text-gray-300 text-sm font-bold mb-2">Tu Nombre (Max 12)</label>
          <input [(ngModel)]="name" (ngModelChange)="name = $event.toLowerCase()" maxlength="12" type="text" class="w-full bg-slate-800 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none focus:border-indigo-500 transition-colors">
        </div>

        <div class="mb-6">
          <label class="block text-gray-300 text-sm font-bold mb-2">Matrícula (Min 4)</label>
          <input [(ngModel)]="extra" (ngModelChange)="extra = $event.toLowerCase()" type="text" class="w-full bg-slate-800 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none focus:border-indigo-500 transition-colors">
        </div>

        <label class="block text-gray-300 text-sm font-bold mb-2">Elige Avatar</label>
        <div class="grid grid-cols-6 gap-2 mb-8">
          @for (av of avatars; track av) {
            <button (click)="selectedAvatar = av"
                    class="text-2xl p-2 rounded hover:bg-white/20 transition"
                    [class.bg-indigo-600]="selectedAvatar === av"
                    [class.ring-2]="selectedAvatar === av">
              {{ av }}
            </button>
          }
        </div>

        <button (click)="login()"
                [disabled]="!name || !selectedAvatar || !extra || extra.length < 4"
                class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 hover:scale-[1.02] transition-transform">
          ¡CONTINUAR!
        </button>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private router = inject(Router);

  name = '';
  extra = '';
  selectedAvatar = '';
  avatars = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼',
    '🐯', '🦁', '🐔', '🐧', '🐦', '🐤', '🦆',
    '🐴', '🐝', '🐛', '🐞', '🐢', '🦖', '🦀', '🐠',
    '🐬', '🐳', '🐋', '🐊', '🦍', '🐘', '🐪',
    '🐎', '🐖', '🐏', '🐑', '🐕', '🐩', '🦅',
    '🐈', '🐓', '🦃', '🦜', '🦢', '🐨', '🦉'];

  ngOnInit() {
    // Check if already logged in
    const storedName = localStorage.getItem('player_name');
    const storedAvatar = localStorage.getItem('player_avatar');

    if (storedName && storedAvatar) {
      // Auto-redirect to game selection
      this.router.navigate(['/games']);
    }
  }

  login() {
    if (!this.name || !this.selectedAvatar || !this.extra || this.extra.length < 4) return;

    const playerId = uuidv4();

    localStorage.setItem('player_name', this.name);
    localStorage.setItem('player_extra', this.extra);
    localStorage.setItem('player_avatar', this.selectedAvatar);
    localStorage.setItem('player_id', playerId);

    this.router.navigate(['/games']);
  }
}
